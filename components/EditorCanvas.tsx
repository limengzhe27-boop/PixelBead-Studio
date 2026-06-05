import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react'
import type { PixelGrid, ToolType } from '../types'
import { renderGrid } from '../utils/canvasRenderer'

/** 画布命令式接口：交互入口统一在编辑器页（Pointer Events），由它驱动这些方法绘制 */
export interface EditorCanvasHandle {
  /** 按下：按当前工具开始（画笔/橡皮进入拖拽；填充/取色/魔法橡皮=单击立即完成；逐行=选行） */
  beginStroke: (clientX: number, clientY: number) => void
  /** 拖动：画笔/橡皮沿途补点绘制（Bresenham 不断线） */
  extendStroke: (clientX: number, clientY: number) => void
  /** 抬起：提交一步历史 */
  endStroke: () => void
  /** 丢弃当前笔（如绘制中途第二指按下转缩放）：不提交、不记历史、恢复显示 */
  cancelStroke: () => void
  /** 是否正处于一笔绘制中 */
  isDrawing: () => boolean
}

interface Props {
  pixels: PixelGrid // 已提交的像素（来自 context）
  cellSize: number
  showGrid: boolean
  legendMap: Map<string, string>
  tool: ToolType
  color: string
  onCommit: (grid: PixelGrid) => void // mouseup 时提交一步历史
  onPickColor: (hex: string) => void // 取色器回调
  guideMode?: boolean // 逐行指南模式：点击选行而非绘制
  onSelectRow?: (r: number) => void // 行定位：点击格子/逐行浮层 选中行（再次点同行取消）
  selectedRow?: number | null // 当前定位高亮行（叠加暗层 + 橙框）
  brushSize?: number // 画笔/橡皮笔刷尺寸 1/2/3（功能3）
  completedRows?: Set<number> // 已完成行绿蒙层（功能6）
  panMode?: boolean // 手型/空格 平移模式：不绘制（模块2）
}

function clone(grid: PixelGrid): PixelGrid {
  return grid.map((row) => row.slice())
}

const RENDER_LIMIT = 8192 // 画布缓冲区单边上限（编辑器页已据此夹紧 renderCell，这里再兜底一次）

/**
 * 编辑器图纸绘制：缩放=重绘——cellSize 已是「目标缩放后的格子大小」，按它 + 设备像素比(DPR)
 * 重画整图（矢量文字 + 纯色格），放大后清晰；不再做 CSS 拉伸。再加拼盘分区线、缩小时隐藏色号。
 */
function drawEditor(
  canvas: HTMLCanvasElement,
  grid: PixelGrid,
  o: {
    cellSize: number
    showGrid: boolean
    legendMap?: Map<string, string>
    completedRows?: Set<number>
    selectedRow?: number | null
  },
): void {
  const cols = grid[0]?.length ?? 0
  if (!cols) return
  const dpr = typeof window !== 'undefined' ? Math.min(window.devicePixelRatio || 1, 3) : 1
  const pr = Math.max(1, Math.min(dpr, Math.floor(RENDER_LIMIT / (cols * o.cellSize))))
  const showText = o.cellSize >= 14 // 每格 <14px 时隐藏色号（太小看不清），放大后自动显示
  renderGrid(canvas, grid, o.cellSize, o.showGrid, showText ? o.legendMap : undefined, {
    completedRows: o.completedRows,
    selectedRow: o.selectedRow,
    pixelRatio: pr,
    dividers: 29,
  })
}

/** Bresenham 直线，填补快速拖拽时相邻采样点之间的空格 */
function lineCells(r0: number, c0: number, r1: number, c1: number): Array<[number, number]> {
  const cells: Array<[number, number]> = []
  let dx = Math.abs(c1 - c0)
  let dy = Math.abs(r1 - r0)
  const sx = c0 < c1 ? 1 : -1
  const sy = r0 < r1 ? 1 : -1
  let err = dx - dy
  let c = c0
  let r = r0
  // eslint-disable-next-line no-constant-condition
  while (true) {
    cells.push([r, c])
    if (c === c1 && r === r1) break
    const e2 = 2 * err
    if (e2 > -dy) {
      err -= dy
      c += sx
    }
    if (e2 < dx) {
      err += dx
      r += sy
    }
  }
  return cells
}

function floodFill(grid: PixelGrid, r: number, c: number, replacement: string | null) {
  const rows = grid.length
  const cols = grid[0].length
  const target = grid[r][c]
  if (target === replacement) return
  const stack: Array<[number, number]> = [[r, c]]
  while (stack.length) {
    const [cr, cc] = stack.pop()!
    if (cr < 0 || cc < 0 || cr >= rows || cc >= cols) continue
    if (grid[cr][cc] !== target) continue
    grid[cr][cc] = replacement
    stack.push([cr + 1, cc], [cr - 1, cc], [cr, cc + 1], [cr, cc - 1])
  }
}

const EditorCanvas = forwardRef<EditorCanvasHandle, Props>(function EditorCanvas({
  pixels,
  cellSize,
  showGrid,
  legendMap,
  tool,
  color,
  onCommit,
  onPickColor,
  guideMode,
  onSelectRow,
  selectedRow,
  brushSize,
  completedRows,
  panMode,
}: Props, ref) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const workRef = useRef<PixelGrid>(pixels)
  const drawingRef = useRef(false)
  const lastCellRef = useRef<[number, number] | null>(null)
  const rafRef = useRef<number | null>(null)

  // 设置项放入 ref，避免在一笔绘制过程中因闭包过期取到旧值
  const cfg = useRef({ cellSize, showGrid, legendMap, tool, color, onCommit, onPickColor, guideMode, onSelectRow, selectedRow, brushSize, completedRows, panMode })
  cfg.current = { cellSize, showGrid, legendMap, tool, color, onCommit, onPickColor, guideMode, onSelectRow, selectedRow, brushSize, completedRows, panMode }

  // 已提交像素变化（转换进入 / 撤销 / 重做 / 提交后）/ 选中行变化 / 缩放（cellSize 改变）→ 同步 workRef 并整体重绘
  useEffect(() => {
    if (drawingRef.current) return
    workRef.current = pixels
    const canvas = canvasRef.current
    if (canvas) drawEditor(canvas, pixels, { cellSize, showGrid, legendMap, completedRows, selectedRow })
  }, [pixels, cellSize, showGrid, legendMap, completedRows, selectedRow])

  const scheduleRender = () => {
    if (rafRef.current != null) return
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null
      const canvas = canvasRef.current
      if (canvas) drawEditor(canvas, workRef.current, cfg.current)
    })
  }

  // 命中测试与渲染分辨率/缩放解耦：直接用显示矩形 + 网格行列数换算，放大/超采样都正确（不改高亮逻辑）
  const cellFrom = (clientX: number, clientY: number): [number, number] | null => {
    const canvas = canvasRef.current
    if (!canvas) return null
    const rect = canvas.getBoundingClientRect()
    const rows = workRef.current.length
    const cols = workRef.current[0]?.length ?? 0
    if (!rows || !cols || rect.width === 0 || rect.height === 0) return null
    const c = Math.floor((clientX - rect.left) / (rect.width / cols))
    const r = Math.floor((clientY - rect.top) / (rect.height / rows))
    if (r < 0 || c < 0 || r >= rows || c >= cols) return null
    return [r, c]
  }

  const paint = (r: number, c: number) => {
    const { tool: t, color: col, brushSize: bs } = cfg.current
    const val = t === 'eraser' ? null : col
    const size = bs && bs > 1 ? bs : 1
    const start = Math.floor((size - 1) / 2) // 以点击格为中心
    const rows = workRef.current.length
    const cols = workRef.current[0]?.length ?? 0
    for (let dy = 0; dy < size; dy++) {
      for (let dx = 0; dx < size; dx++) {
        const ry = r - start + dy
        const cx = c - start + dx
        if (ry < 0 || cx < 0 || ry >= rows || cx >= cols) continue // 边界跳过，不报错
        workRef.current[ry][cx] = val
      }
    }
  }

  // —— 命令式绘制接口（交互入口在编辑器页的统一 Pointer 处理）——

  const beginStroke = (clientX: number, clientY: number) => {
    if (cfg.current.panMode) return // 手型/空格 平移模式：不绘制，交给容器平移
    const cell = cellFrom(clientX, clientY)
    if (!cell) return
    const [r, c] = cell

    if (cfg.current.guideMode) {
      cfg.current.onSelectRow?.(r) // 逐行指南：点击只选行，不绘制（仅此模式才高亮行）
      return
    }

    const { tool: t } = cfg.current

    if (t === 'eyedropper') {
      const hex = workRef.current[r][c]
      if (hex) cfg.current.onPickColor(hex)
      return
    }

    // 开始一笔：克隆当前像素到 workRef（绘制全程不触发 React state）
    workRef.current = clone(pixels)

    if (t === 'bucket') {
      floodFill(workRef.current, r, c, cfg.current.color)
      const canvas = canvasRef.current
      if (canvas) drawEditor(canvas, workRef.current, cfg.current)
      cfg.current.onCommit(workRef.current) // 单击操作，立即提交
      return
    }

    if (t === 'magicEraser') {
      // 魔法橡皮：洪水填充将相连同色区域置 null（透明），单击操作
      floodFill(workRef.current, r, c, null)
      const canvas = canvasRef.current
      if (canvas) drawEditor(canvas, workRef.current, cfg.current)
      cfg.current.onCommit(workRef.current)
      return
    }

    // 画笔 / 橡皮：进入拖拽模式（即时绘制到 canvas，抬笔才提交）
    drawingRef.current = true
    lastCellRef.current = [r, c]
    paint(r, c)
    scheduleRender()
  }

  const extendStroke = (clientX: number, clientY: number) => {
    if (!drawingRef.current) return
    const cell = cellFrom(clientX, clientY)
    if (!cell) return
    const [r, c] = cell
    const last = lastCellRef.current
    if (last && (last[0] !== r || last[1] !== c)) {
      for (const [lr, lc] of lineCells(last[0], last[1], r, c)) paint(lr, lc) // 两点补全，拖快不断线
    } else {
      paint(r, c)
    }
    lastCellRef.current = [r, c]
    scheduleRender()
  }

  const finishRaf = () => {
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
  }

  const endStroke = () => {
    if (!drawingRef.current) return
    drawingRef.current = false
    lastCellRef.current = null
    finishRaf()
    cfg.current.onCommit(workRef.current) // 提交一步历史，同步 React state
  }

  const cancelStroke = () => {
    if (!drawingRef.current) return
    drawingRef.current = false
    lastCellRef.current = null
    finishRaf()
    // 丢弃本笔：恢复到已提交像素并重绘，不提交、不记历史
    workRef.current = pixels
    const canvas = canvasRef.current
    if (canvas) drawEditor(canvas, pixels, { cellSize, showGrid, legendMap, completedRows, selectedRow })
  }

  useImperativeHandle(ref, () => ({
    beginStroke,
    extendStroke,
    endStroke,
    cancelStroke,
    isDrawing: () => drawingRef.current,
  }))

  // 卸载清理
  useEffect(() => {
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current)
    }
  }, [])

  const cursor = panMode ? 'grab' : guideMode ? 'pointer' : tool === 'eyedropper' ? 'copy' : 'crosshair'

  return (
    <canvas
      ref={canvasRef}
      onContextMenu={(e) => e.preventDefault()}
      style={{ cursor, touchAction: 'none' }}
      className="block rounded-md shadow-craft"
    />
  )
})

export default EditorCanvas
