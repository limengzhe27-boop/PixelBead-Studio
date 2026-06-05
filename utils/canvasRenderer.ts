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

function roundRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  if (typeof ctx.roundRect === 'function') {
    ctx.beginPath()
    ctx.roundRect(x, y, w, h, r)
    return
  }
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

/** 相对亮度，决定序号文字用深色还是白色，保证可读 */
function isDark(hex: string): boolean {
  const h = hex.replace('#', '')
  const r = parseInt(h.slice(0, 2), 16)
  const g = parseInt(h.slice(2, 4), 16)
  const b = parseInt(h.slice(4, 6), 16)
  // sRGB 相对亮度近似
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return lum < 0.58
}

export interface RenderOptions {
  /** 是否绘制空白格的棋盘底纹（编辑器开，PNG 导出关 → 透明） */
  drawEmpty?: boolean
  /** 已完成行（叠加半透明绿色蒙层，功能6） */
  completedRows?: Set<number>
  /** 行定位高亮：当前选中行（其余行压暗 + 橙色描边）；null/undefined 不绘制 */
  selectedRow?: number | null
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
  const w = cols * cellSize
  const h = rows * cellSize

  // 仅在尺寸变化时重设，避免不必要的清空/重分配
  if (canvas.width !== w) canvas.width = w
  if (canvas.height !== h) canvas.height = h

  const ctx = canvas.getContext('2d')
  if (!ctx) return
  ctx.clearRect(0, 0, w, h)

  const drawEmpty = options.drawEmpty ?? true
  const radius = cellSize >= 4 ? Math.max(1, Math.floor(cellSize * 0.24)) : 0
  const gloss = cellSize >= 8
  const showNum = !!legendMap && cellSize >= 10
  const inset = cellSize >= 6 ? 0.5 : 0 // 留出微缝，beads 之间有间隙感

  if (showNum) {
    ctx.font = `500 ${Math.max(8, Math.round(cellSize * 0.46))}px "DM Mono", ui-monospace, monospace`
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

      const bx = dx + inset
      const by = py + inset
      const bw = cellSize - inset * 2
      const bh = cellSize - inset * 2

      // 豆体填充
      ctx.fillStyle = px
      if (radius > 0) {
        roundRectPath(ctx, bx, by, bw, bh, radius)
        ctx.fill()
      } else {
        ctx.fillRect(bx, by, bw, bh)
      }

      // 3D 高光（圆形拼豆质感）
      if (gloss) {
        ctx.save()
        if (radius > 0) {
          roundRectPath(ctx, bx, by, bw, bh, radius)
          ctx.clip()
        }
        // 左上柔光
        ctx.fillStyle = 'rgba(255,255,255,0.34)'
        ctx.beginPath()
        ctx.ellipse(
          bx + bw * 0.34,
          by + bh * 0.3,
          bw * 0.2,
          bh * 0.13,
          -0.5,
          0,
          Math.PI * 2,
        )
        ctx.fill()
        // 右下暗边，增加体积感
        ctx.fillStyle = 'rgba(0,0,0,0.1)'
        ctx.beginPath()
        ctx.ellipse(
          bx + bw * 0.7,
          by + bh * 0.78,
          bw * 0.32,
          bh * 0.18,
          -0.5,
          0,
          Math.PI * 2,
        )
        ctx.fill()
        ctx.restore()
      }

      // 序号
      if (showNum && legendMap) {
        const num = legendMap.get(px)
        if (num !== undefined) {
          ctx.fillStyle = isDark(px) ? 'rgba(255,255,255,0.92)' : 'rgba(20,18,16,0.82)'
          ctx.fillText(String(num), dx + cellSize / 2, py + cellSize / 2 + 0.5)
        }
      }
    }
  }

  // 网格线
  if (showGrid && cellSize >= 6) {
    ctx.strokeStyle = 'rgba(43,38,34,0.12)'
    ctx.lineWidth = 1
    ctx.beginPath()
    for (let x = 0; x <= cols; x++) {
      const gx = Math.round(x * cellSize) + 0.5
      ctx.moveTo(gx, 0)
      ctx.lineTo(gx, h)
    }
    for (let y = 0; y <= rows; y++) {
      const gy = Math.round(y * cellSize) + 0.5
      ctx.moveTo(0, gy)
      ctx.lineTo(w, gy)
    }
    ctx.stroke()

    // 每 10 格加粗一条参考线，方便大图纸定位（拼豆/十字绣惯例）
    if (cellSize >= 8) {
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
