import type { PixelGrid } from '../types'

/**
 * Canvas 绘制（纯函数，零 React 依赖）—— PRD §8.3 / §F4 / §11
 *
 * 该函数被预览、编辑器、PNG 导出复用。编辑器画笔直接调用它操作 canvasRef，
 * 不经过任何 React state，保证「跟手」。
 *
 * 性能降级（§11）：
 *   cellSize < 8 → 关闭 3D 高光
 *   cellSize < 4 → 关闭圆角，改用 fillRect
 *   cellSize < 10 → 隐藏序号（§F3/§F5）
 */

const EMPTY_LIGHT = '#FAF8F2'
const EMPTY_DARK = '#ECE8DE'

/** 色号文字取黑/白：浅格用黑字、深格用白字，保证高对比可读（§5.3） */
function textColorFor(hex: string): string {
  const h = hex.replace('#', '')
  const r = parseInt(h.slice(0, 2), 16)
  const g = parseInt(h.slice(2, 4), 16)
  const b = parseInt(h.slice(4, 6), 16)
  const luma = 0.299 * r + 0.587 * g + 0.114 * b // 感知亮度 0–255
  return luma > 140 ? '#000000' : '#FFFFFF'
}

export interface RenderOptions {
  /** 是否绘制空白格的棋盘底纹（编辑器开，PNG 导出关 → 透明） */
  drawEmpty?: boolean
  /** 已完成行（叠加半透明绿色蒙层，功能6） */
  completedRows?: Set<number>
  /** 行定位高亮：当前选中行（其余行压暗 + 橙色描边）；null/undefined 不绘制 */
  selectedRow?: number | null
  /**
   * 设备像素比 / 超采样倍率（§5.2）。editor 传 >1：画布缓冲区放大该倍、CSS 显示尺寸不变、
   * 坐标按 CSS 像素绘制 → 放大后依然清晰（不是拉伸位图）。PDF / 预览不传 = 1，行为不变。
   */
  pixelRatio?: number
  /** 每 N 格画一条拼盘分区粗线（editor 传 29 = 一块拼盘）；不传则沿用旧的每 10 格参考线 */
  dividers?: number
}

export function renderGrid(
  canvas: HTMLCanvasElement,
  pixels: PixelGrid,
  cellSize: number,
  showGrid: boolean,
  legendMap?: Map<string, string>, // hex → 真实色号（如 A13），在格子上标注
  options: RenderOptions = {},
): void {
  const rows = pixels.length
  const cols = rows > 0 ? pixels[0].length : 0
  const w = cols * cellSize // CSS 像素尺寸
  const h = rows * cellSize

  // 高清渲染：缓冲区按 pixelRatio 放大，CSS 显示尺寸保持 w×h，绘制坐标用 CSS 像素（§5.2）
  const pr = options.pixelRatio ?? 1
  const bw = Math.round(w * pr)
  const bh = Math.round(h * pr)
  if (canvas.width !== bw) canvas.width = bw
  if (canvas.height !== bh) canvas.height = bh
  if (options.pixelRatio != null) {
    canvas.style.width = `${w}px`
    canvas.style.height = `${h}px`
  }

  const ctx = canvas.getContext('2d')
  if (!ctx) return
  ctx.setTransform(pr, 0, 0, pr, 0, 0) // 之后按 CSS 像素坐标绘制即可
  ctx.clearRect(0, 0, w, h)

  const drawEmpty = options.drawEmpty ?? true
  // 平整纯色格子（§5.1）：去掉圆角 + 渐变光泽，换成纯色方块 + 细边框，读图最清晰
  const showBorder = showGrid && cellSize >= 4
  const showNum = !!legendMap && cellSize >= 11

  if (showNum) {
    ctx.font = `600 ${Math.max(7, Math.floor(cellSize * 0.4))}px "DM Mono", ui-monospace, monospace`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
  }

  for (let y = 0; y < rows; y++) {
    const py = y * cellSize
    for (let x = 0; x < cols; x++) {
      const px = pixels[y][x]
      const dx = x * cellSize
      if (px === null) {
        if (drawEmpty) {
          ctx.fillStyle = (x + y) % 2 === 0 ? EMPTY_LIGHT : EMPTY_DARK
          ctx.fillRect(dx, py, cellSize, cellSize)
        }
        continue
      }

      // 纯色填充
      ctx.fillStyle = px
      ctx.fillRect(dx, py, cellSize, cellSize)

      // 1px 细边框（仅在显示网格时）
      if (showBorder) {
        ctx.strokeStyle = 'rgba(0,0,0,0.12)'
        ctx.lineWidth = 1
        ctx.strokeRect(dx + 0.5, py + 0.5, cellSize - 1, cellSize - 1)
      }

      // 高对比色号文字（§5.3：浅格黑字、深格白字；字号随 cellSize 自适应）
      if (showNum && legendMap) {
        const code = legendMap.get(px)
        if (code !== undefined) {
          ctx.fillStyle = textColorFor(px)
          ctx.fillText(String(code), dx + cellSize / 2, py + cellSize / 2)
        }
      }
    }
  }

  // 拼盘分区线 / 参考线（§5.4）
  if (showGrid && cellSize >= 6) {
    const n = options.dividers && options.dividers > 0 ? options.dividers : 0
    if (n > 0) {
      // 每 n 格（一块拼盘）一条较粗的珊瑚红分区线，方便定位
      ctx.strokeStyle = 'rgba(214,69,52,0.65)'
      ctx.lineWidth = Math.max(1.5, cellSize * 0.08)
      ctx.beginPath()
      for (let x = n; x < cols; x += n) {
        const gx = Math.round(x * cellSize) + 0.5
        ctx.moveTo(gx, 0)
        ctx.lineTo(gx, h)
      }
      for (let y = n; y < rows; y += n) {
        const gy = Math.round(y * cellSize) + 0.5
        ctx.moveTo(0, gy)
        ctx.lineTo(w, gy)
      }
      ctx.stroke()
    } else if (cellSize >= 8) {
      // 旧：每 10 格加粗一条参考线（PDF / 预览沿用）
      ctx.strokeStyle = 'rgba(43,38,34,0.28)'
      ctx.lineWidth = 1
      ctx.beginPath()
      for (let x = 0; x <= cols; x += 10) {
        const gx = Math.round(x * cellSize) + 0.5
        ctx.moveTo(gx, 0)
        ctx.lineTo(gx, h)
      }
      for (let y = 0; y <= rows; y += 10) {
        const gy = Math.round(y * cellSize) + 0.5
        ctx.moveTo(0, gy)
        ctx.lineTo(w, gy)
      }
      ctx.stroke()
    }
  }

  // 已完成行：半透明绿色蒙层（功能6）
  const done = options.completedRows
  if (done && done.size) {
    ctx.fillStyle = 'rgba(0,200,0,0.2)'
    for (const r of done) {
      if (r >= 0 && r < rows) ctx.fillRect(0, r * cellSize, w, cellSize)
    }
  }

  // 行定位高亮（叠加层）：非选中行压暗 + 选中行整行橙色描边
  const sel = options.selectedRow
  if (sel != null && sel >= 0 && sel < rows) {
    const top = sel * cellSize
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)'
    if (sel > 0) ctx.fillRect(0, 0, w, top) // 选中行以上
    if (sel < rows - 1) ctx.fillRect(0, top + cellSize, w, h - (top + cellSize)) // 选中行以下
    ctx.strokeStyle = '#FF6B00'
    ctx.lineWidth = 3
    ctx.strokeRect(1.5, top + 1.5, w - 3, cellSize - 3) // 内描边，避免被裁切
  }
}

/** 调整 hex 明度：amount>0 变亮、<0 变暗（用于烫后圆珠的球面渐变） */
function shade(hex: string, amount: number): string {
  const adj = (i: number) => {
    const c = parseInt(hex.slice(i, i + 2), 16)
    const v = Math.max(0, Math.min(255, Math.round(c + 255 * amount)))
    return v.toString(16).padStart(2, '0')
  }
  return `#${adj(1)}${adj(3)}${adj(5)}`
}

/**
 * 烫后效果渲染：每颗豆子是立体发光的圆珠（球面径向渐变 + 塑料高光），不再依赖 CSS 滤镜。
 * 性能保护：豆子 > 5000 或 cellSize < 5 时改用轻量渲染（纯色圆 + 静态高光点），避免大网格创建海量渐变卡顿。
 */
export function renderIroned(canvas: HTMLCanvasElement, pixels: PixelGrid, cellSize: number): void {
  const rows = pixels.length
  const cols = rows > 0 ? pixels[0].length : 0
  const w = cols * cellSize
  const h = rows * cellSize
  if (canvas.width !== w) canvas.width = w
  if (canvas.height !== h) canvas.height = h
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  ctx.clearRect(0, 0, w, h)

  const useSimple = rows * cols > 5000 || cellSize < 5
  const radius = cellSize * 0.46 // 留约 8% 缝隙

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const color = pixels[r][c]
      if (!color) continue
      const cx = c * cellSize + cellSize / 2
      const cy = r * cellSize + cellSize / 2

      if (useSimple) {
        // 轻量：纯色圆 + 静态高光点（不创建渐变）
        ctx.fillStyle = color
        ctx.beginPath()
        ctx.arc(cx, cy, radius, 0, Math.PI * 2)
        ctx.fill()
        ctx.fillStyle = 'rgba(255,255,255,0.45)'
        ctx.beginPath()
        ctx.arc(cx - radius * 0.3, cy - radius * 0.3, radius * 0.28, 0, Math.PI * 2)
        ctx.fill()
        continue
      }

      // 球面径向渐变（左上亮 → 本色 → 右下暗）
      const body = ctx.createRadialGradient(cx - radius * 0.35, cy - radius * 0.35, radius * 0.1, cx, cy, radius)
      body.addColorStop(0, shade(color, 0.35))
      body.addColorStop(0.55, color)
      body.addColorStop(1, shade(color, -0.22))
      ctx.fillStyle = body
      ctx.beginPath()
      ctx.arc(cx, cy, radius, 0, Math.PI * 2)
      ctx.fill()
      // 塑料反光亮斑
      const spec = ctx.createRadialGradient(cx - radius * 0.35, cy - radius * 0.35, 0, cx - radius * 0.35, cy - radius * 0.35, radius * 0.55)
      spec.addColorStop(0, 'rgba(255,255,255,0.65)')
      spec.addColorStop(1, 'rgba(255,255,255,0)')
      ctx.fillStyle = spec
      ctx.beginPath()
      ctx.arc(cx - radius * 0.3, cy - radius * 0.3, radius * 0.55, 0, Math.PI * 2)
      ctx.fill()
    }
  }
}

/** 将像素网格渲染到离屏 canvas 并返回 dataURL（PNG 导出 / 缩略图复用） */
export function gridToDataURL(pixels: PixelGrid, cellSize: number): string {
  const canvas = document.createElement('canvas')
  renderGrid(canvas, pixels, cellSize, false, undefined, { drawEmpty: false })
  return canvas.toDataURL('image/png')
}
