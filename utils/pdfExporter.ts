import type { jsPDF } from 'jspdf' // 仅类型（编译期擦除）；运行时在 exportPDF 内动态 import，避免 jspdf 进入编辑器主包
import type { LegendItem, PixelGrid } from '../types'
import { renderGrid, gridToDataURL } from './canvasRenderer'
import { encodeAllRows, segmentLabel } from './runLengthEncoder'

/**
 * 导出（PRD §F6）
 *
 * 中文方案：为保证「中文必须可读、绝不乱码」这条红线在任何环境下都成立，
 * 这里不依赖 jsPDF 内嵌字体（CJK 字体多为 CFF/OTF，jsPDF 无法嵌入），
 * 而是把每一页用高 DPI 离屏 canvas 绘制（直接用浏览器系统中文字体），
 * 再作为整页图片放入 PDF。打印效果一致、离线可用、无字体授权问题。
 * （Phase 2 可升级为内嵌 glyf 中文字体子集以获得可选中的矢量文字。）
 */

const CJK_FONT = '"PingFang SC","Heiti SC","Hiragino Sans GB","Microsoft YaHei","Noto Sans SC",sans-serif'
const MONO_FONT = '"DM Mono",ui-monospace,"SFMono-Regular",monospace'

// A4 纵向（pt）
const PAGE_W = 595.28
const PAGE_H = 841.89
const MARGIN = 40
const S = 2 // 渲染缩放（200dpi 级别），兼顾清晰度与文件体积
const JPEG_Q = 0.92 // 整页 JPEG 质量，避免 PNG 无损导致体积爆炸
const CELL_PT = 20 // 每颗豆 20pt（§F6）

const px = (pt: number) => Math.round(pt * S)

function makePageCanvas(): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } {
  const canvas = document.createElement('canvas')
  canvas.width = px(PAGE_W)
  canvas.height = px(PAGE_H)
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = '#FFFFFF'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  return { canvas, ctx }
}

function text(
  ctx: CanvasRenderingContext2D,
  s: string,
  xPt: number,
  yPt: number,
  opts: { size?: number; color?: string; font?: string; align?: CanvasTextAlign; weight?: string } = {},
) {
  const { size = 11, color = '#2B2622', font = CJK_FONT, align = 'left', weight = '400' } = opts
  ctx.fillStyle = color
  ctx.font = `${weight} ${px(size)}px ${font}`
  ctx.textAlign = align
  ctx.textBaseline = 'alphabetic'
  ctx.fillText(s, px(xPt), px(yPt))
}

function todayStr(): string {
  const d = new Date()
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

function drawFooter(ctx: CanvasRenderingContext2D, pageNo: number, pageTotal: number) {
  text(ctx, 'PixelBead Studio · 拼豆像素图纸工作台', MARGIN, PAGE_H - 24, {
    size: 9,
    color: '#9A9082',
  })
  text(ctx, `生成于 ${todayStr()}　第 ${pageNo} / ${pageTotal} 页`, PAGE_W - MARGIN, PAGE_H - 24, {
    size: 9,
    color: '#9A9082',
    align: 'right',
  })
}

// ---------- 图纸页（含序号），过大自动分多页 ----------

function buildChartPages(
  doc: jsPDF,
  pixels: PixelGrid,
  legend: LegendItem[],
  meta: { cols: number; rows: number },
  startPageNo: number,
  pageTotal: number,
): number {
  const legendMap = new Map<string, string>()
  for (const it of legend) legendMap.set(it.hex.toUpperCase(), it.artkalCode)

  const headerH = 34
  const footerH = 30
  const usableW = PAGE_W - MARGIN * 2
  const usableH = PAGE_H - MARGIN * 2 - headerH - footerH
  const colsPerPage = Math.max(1, Math.floor(usableW / CELL_PT))
  const rowsPerPage = Math.max(1, Math.floor(usableH / CELL_PT))

  const totalRows = pixels.length
  const totalCols = pixels[0]?.length ?? 0
  const tileCols = Math.ceil(totalCols / colsPerPage)
  const tileRows = Math.ceil(totalRows / rowsPerPage)

  let pageNo = startPageNo
  for (let ty = 0; ty < tileRows; ty++) {
    for (let tx = 0; tx < tileCols; tx++) {
      if (pageNo > startPageNo) doc.addPage()
      const { canvas, ctx } = makePageCanvas()

      const c0 = tx * colsPerPage
      const c1 = Math.min(totalCols, c0 + colsPerPage)
      const r0 = ty * rowsPerPage
      const r1 = Math.min(totalRows, r0 + rowsPerPage)
      const sub = pixels.slice(r0, r1).map((row) => row.slice(c0, c1))

      // 标题
      text(ctx, '拼豆图纸', MARGIN, MARGIN + 14, { size: 16, weight: '600' })
      text(ctx, `${meta.cols} × ${meta.rows} 颗`, MARGIN + 86, MARGIN + 14, {
        size: 11,
        color: '#6B6256',
        font: MONO_FONT,
      })
      if (tileCols > 1 || tileRows > 1) {
        text(
          ctx,
          `行 ${r0 + 1}–${r1}　列 ${c0 + 1}–${c1}`,
          PAGE_W - MARGIN,
          MARGIN + 14,
          { size: 10, color: '#6B6256', align: 'right' },
        )
      }

      // 图纸（离屏渲染后贴入）
      const chart = document.createElement('canvas')
      renderGrid(chart, sub, CELL_PT * S, true, legendMap, { drawEmpty: true })
      const drawWpt = (c1 - c0) * CELL_PT
      const drawHpt = (r1 - r0) * CELL_PT
      ctx.drawImage(chart, px(MARGIN), px(MARGIN + headerH), px(drawWpt), px(drawHpt))

      drawFooter(ctx, pageNo, pageTotal)
      doc.addImage(canvas.toDataURL('image/jpeg', JPEG_Q), 'JPEG', 0, 0, PAGE_W, PAGE_H)
      pageNo++
    }
  }
  return pageNo
}

// ---------- 图例 + 用豆清单页 ----------

function buildLegendPages(
  doc: jsPDF,
  legend: LegendItem[],
  startPageNo: number,
  pageTotal: number,
): number {
  const headerH = 56
  const footerH = 30
  const rowH = 26
  const usableH = PAGE_H - MARGIN * 2 - headerH - footerH
  const perPage = Math.max(1, Math.floor(usableH / rowH))

  // 列布局（pt）
  const COL = { idx: 60, sw: 84, code: 110, name: 165, count: 380, pct: 500 }
  const total = legend.reduce((s, it) => s + it.count, 0)

  const chunks: LegendItem[][] = []
  for (let i = 0; i < legend.length; i += perPage) chunks.push(legend.slice(i, i + perPage))
  if (chunks.length === 0) chunks.push([])

  let pageNo = startPageNo
  chunks.forEach((chunk, ci) => {
    doc.addPage()
    const { canvas, ctx } = makePageCanvas()

    // 标题
    text(ctx, '颜色图例 · 用豆清单', MARGIN, MARGIN + 16, { size: 16, weight: '600' })
    text(ctx, `共 ${legend.length} 种颜色 · ${total} 颗`, PAGE_W - MARGIN, MARGIN + 16, {
      size: 11,
      color: '#6B6256',
      align: 'right',
    })

    // 表头
    const headY = MARGIN + headerH - 8
    text(ctx, '序号', COL.idx, headY, { size: 10, color: '#9A9082', align: 'center' })
    text(ctx, '色块', COL.sw + 8, headY, { size: 10, color: '#9A9082', align: 'center' })
    text(ctx, '色号', COL.code, headY, { size: 10, color: '#9A9082' })
    text(ctx, '颜色名称', COL.name, headY, { size: 10, color: '#9A9082' })
    text(ctx, '数量', COL.count, headY, { size: 10, color: '#9A9082', align: 'right' })
    text(ctx, '占比', COL.pct, headY, { size: 10, color: '#9A9082', align: 'right' })
    ctx.strokeStyle = '#ECE4D4'
    ctx.lineWidth = px(1)
    ctx.beginPath()
    ctx.moveTo(px(MARGIN), px(headY + 8))
    ctx.lineTo(px(PAGE_W - MARGIN), px(headY + 8))
    ctx.stroke()

    // 行
    let y = MARGIN + headerH + 16
    for (const it of chunk) {
      text(ctx, String(it.index), COL.idx, y, { size: 11, align: 'center', color: '#6B6256', font: MONO_FONT })
      // 色块
      ctx.fillStyle = it.hex
      ctx.strokeStyle = 'rgba(0,0,0,0.12)'
      ctx.lineWidth = px(1)
      const swSize = 14
      ctx.fillRect(px(COL.sw), px(y - swSize + 2), px(swSize), px(swSize))
      ctx.strokeRect(px(COL.sw), px(y - swSize + 2), px(swSize), px(swSize))
      text(ctx, it.artkalCode, COL.code, y, { size: 11, font: MONO_FONT, color: '#2B2622' })
      text(ctx, `${it.name_cn} · ${it.name_en}`, COL.name, y, { size: 11, color: '#2B2622' })
      text(ctx, `${it.count} 颗`, COL.count, y, { size: 11, align: 'right', font: MONO_FONT })
      text(ctx, `${it.percentage}%`, COL.pct, y, { size: 11, align: 'right', font: MONO_FONT, color: '#6B6256' })
      y += rowH
    }

    // 合计行（最后一页）
    if (ci === chunks.length - 1) {
      ctx.strokeStyle = '#DED3BD'
      ctx.lineWidth = px(1)
      ctx.beginPath()
      ctx.moveTo(px(MARGIN), px(y - 14))
      ctx.lineTo(px(PAGE_W - MARGIN), px(y - 14))
      ctx.stroke()
      text(ctx, '合计', COL.code, y + 4, { size: 12, weight: '600' })
      text(ctx, `${legend.length} 种颜色`, COL.name, y + 4, { size: 12, weight: '600' })
      text(ctx, `${total} 颗`, COL.count, y + 4, { size: 12, align: 'right', weight: '600', font: MONO_FONT })
    }

    drawFooter(ctx, pageNo, pageTotal)
    doc.addImage(canvas.toDataURL('image/jpeg', JPEG_Q), 'JPEG', 0, 0, PAGE_W, PAGE_H)
    pageNo++
  })
  return pageNo
}

// ---------- 计算总页数（用于页脚 N/总） ----------

function countChartPages(pixels: PixelGrid): number {
  const headerH = 34
  const footerH = 30
  const usableW = PAGE_W - MARGIN * 2
  const usableH = PAGE_H - MARGIN * 2 - headerH - footerH
  const colsPerPage = Math.max(1, Math.floor(usableW / CELL_PT))
  const rowsPerPage = Math.max(1, Math.floor(usableH / CELL_PT))
  const totalCols = pixels[0]?.length ?? 0
  return Math.ceil(totalCols / colsPerPage) * Math.ceil(pixels.length / rowsPerPage)
}

function countLegendPages(legend: LegendItem[]): number {
  const usableH = PAGE_H - MARGIN * 2 - 56 - 30
  const perPage = Math.max(1, Math.floor(usableH / 26))
  return Math.max(1, Math.ceil(legend.length / perPage))
}

// ---------- 逐行施工表（游程编码）----------

const GUIDE_LINE_H = 15
const GUIDE_HEADER_H = 50
const GUIDE_INDENT = 58

function wrapTokens(ctx: CanvasRenderingContext2D, tokens: string[], maxWpt: number): string[] {
  ctx.font = `${px(10.5)}px ${CJK_FONT}`
  const sep = ' · '
  const lines: string[] = []
  let cur = ''
  for (const t of tokens) {
    const trial = cur ? cur + sep + t : t
    if (cur && ctx.measureText(trial).width / S > maxWpt) {
      lines.push(cur)
      cur = t
    } else {
      cur = trial
    }
  }
  if (cur) lines.push(cur)
  return lines.length ? lines : ['（空行）']
}

function countRowGuidePages(pixels: PixelGrid): number {
  const scratch = document.createElement('canvas').getContext('2d')
  if (!scratch) return 1
  const usableBottom = PAGE_H - MARGIN - 30
  const seqMaxW = PAGE_W - MARGIN - GUIDE_INDENT
  let pages = 1
  let y = MARGIN + GUIDE_HEADER_H
  for (const segs of encodeAllRows(pixels)) {
    const lines = wrapTokens(scratch, segs.map(segmentLabel), seqMaxW)
    const blockH = lines.length * GUIDE_LINE_H + 6
    if (y + blockH > usableBottom) {
      pages++
      y = MARGIN + GUIDE_HEADER_H
    }
    y += blockH
  }
  return pages
}

function buildRowGuidePages(doc: jsPDF, pixels: PixelGrid, startPageNo: number, pageTotal: number): number {
  const usableBottom = PAGE_H - MARGIN - 30
  const seqMaxW = PAGE_W - MARGIN - GUIDE_INDENT
  let pageNo = startPageNo

  const title = (ctx: CanvasRenderingContext2D) => {
    text(ctx, '逐行施工表', MARGIN, MARGIN + 16, { size: 16, weight: '600' })
    text(ctx, '每拼完一行可勾掉', PAGE_W - MARGIN, MARGIN + 16, { size: 10, color: '#9A9082', align: 'right' })
  }

  doc.addPage()
  let page = makePageCanvas()
  title(page.ctx)
  let y = MARGIN + GUIDE_HEADER_H

  const flush = (createNew: boolean) => {
    drawFooter(page.ctx, pageNo, pageTotal)
    doc.addImage(page.canvas.toDataURL('image/jpeg', JPEG_Q), 'JPEG', 0, 0, PAGE_W, PAGE_H)
    pageNo++
    if (createNew) {
      doc.addPage()
      page = makePageCanvas()
      title(page.ctx)
      y = MARGIN + GUIDE_HEADER_H
    }
  }

  encodeAllRows(pixels).forEach((segs, i) => {
    const lines = wrapTokens(page.ctx, segs.map(segmentLabel), seqMaxW)
    const blockH = lines.length * GUIDE_LINE_H + 6
    if (y + blockH > usableBottom) flush(true)

    text(page.ctx, `第 ${i + 1} 行`, MARGIN, y + 11, { size: 11, weight: '600' })
    page.ctx.strokeStyle = '#C8BAA0'
    page.ctx.lineWidth = px(1.2)
    page.ctx.strokeRect(px(MARGIN + 40), px(y + 1), px(11), px(11))
    lines.forEach((ln, li) => text(page.ctx, ln, GUIDE_INDENT, y + 11 + li * GUIDE_LINE_H, { size: 10.5, color: '#5C5648' }))
    y += blockH
    page.ctx.strokeStyle = '#F2ECDD'
    page.ctx.lineWidth = px(1)
    page.ctx.beginPath()
    page.ctx.moveTo(px(MARGIN), px(y - 3))
    page.ctx.lineTo(px(PAGE_W - MARGIN), px(y - 3))
    page.ctx.stroke()
  })
  flush(false)
  return pageNo
}

export async function exportPDF(
  pixels: PixelGrid,
  legend: LegendItem[],
  meta: { cols: number; rows: number },
): Promise<void> {
  const { jsPDF: JsPDF } = await import('jspdf') // 懒加载：仅在真正导出 PDF 时才拉取 jspdf
  const doc = new JsPDF({ unit: 'pt', format: 'a4', orientation: 'portrait' })
  const pageTotal = countChartPages(pixels) + countLegendPages(legend) + countRowGuidePages(pixels)
  const afterChart = buildChartPages(doc, pixels, legend, meta, 1, pageTotal)
  const afterLegend = buildLegendPages(doc, legend, afterChart, pageTotal)
  buildRowGuidePages(doc, pixels, afterLegend, pageTotal)
  doc.save(`拼豆图纸_${meta.cols}x${meta.rows}.pdf`)
}

export async function exportPNG(pixels: PixelGrid): Promise<void> {
  const url = gridToDataURL(pixels, 20) // 纯图纸，每格 20px，透明底（§F6）
  const a = document.createElement('a')
  a.href = url
  a.download = '拼豆图纸.png'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}
