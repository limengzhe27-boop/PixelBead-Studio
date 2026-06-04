import { useEffect, useRef } from 'react'
import type { MouseEvent as ReactMouseEvent } from 'react'
import type { PixelGrid, ToolType } from '../types'
import { renderGrid } from '../utils/canvasRenderer'

interface Props {
  pixels: PixelGrid // 已提交的像素（来自 context）
  cellSize: number
  showGrid: boolean
  legendMap: Map<string, number>
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

export default function EditorCanvas({
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
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const workRef = useRef<PixelGrid>(pixels)
  const drawingRef = useRef(false)
  const lastCellRef = useRef<[number, number] | null>(null)
  const rafRef = useRef<number | null>(null)

  // 设置项放入 ref，避免在一笔绘制过程中因闭包过期取到旧值
  const cfg = useRef({ cellSize, showGrid, legendMap, tool, color, onCommit, onPickColor, guideMode, onSelectRow, selectedRow, brushSize, completedRows, panMode })
  cfg.current = { cellSize, showGrid, legendMap, tool, color, onCommit, onPickColor, guideMode, onSelectRow, selectedRow, brushSize, completedRows, panMode }

  // 已提交像素变化（转换进入 / 撤销 / 重做 / 提交后）/ 选中行变化 → 同步 workRef 并整体重绘
  useEffect(() => {
    if (drawingRef.current) return
    workRef.current = pixels
    const canvas = canvasRef.current
    if (canvas) renderGrid(canvas, pixels, cellSize, showGrid, legendMap, { completedRows, selectedRow })
  }, [pixels, cellSize, showGrid, legendMap, completedRows, selectedRow])

  const scheduleRender = () => {
    if (rafRef.current != null) return
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null
      const canvas = canvasRef.current
      if (canvas) {
        const { cellSize: cs, showGrid: sg, legendMap: lm, completedRows: cr, selectedRow: sr } = cfg.current
        renderGrid(canvas, workRef.current, cs, sg, lm, { completedRows: cr, selectedRow: sr })
      }
    })
  }

  const cellFromEvent = (e: MouseEvent | ReactMouseEvent): [number, number] | null => {
    const canvas = canvasRef.current
    if (!canvas) return null
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    const x = (e.clientX - rect.left) * scaleX
    const y = (e.clientY - rect.top) * scaleY
    const c = Math.floor(x / cfg.current.cellSize)
    const r = Math.floor(y / cfg.current.cellSize)
    const rows = workRef.current.length
    const cols = workRef.current[0]?.length ?? 0
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

  const handleMouseDown = (e: ReactMouseEvent) => {
    if (cfg.current.panMode) return // 手型/空格 平移模式：不绘制，交给容器平移
    if (e.button !== 0) return
    const cell = cellFromEvent(e)
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
      if (canvas) renderGrid(canvas, workRef.current, cfg.current.cellSize, cfg.current.showGrid, cfg.current.legendMap, { completedRows: cfg.current.completedRows, selectedRow: cfg.current.selectedRow })
      cfg.current.onCommit(workRef.current) // 单击操作，立即提交
      return
    }

    if (t === 'magicEraser') {
      // 魔法橡皮：洪水填充将相连同色区域置 null（透明），单击操作
      floodFill(workRef.current, r, c, null)
      const canvas = canvasRef.current
      if (canvas) renderGrid(canvas, workRef.current, cfg.current.cellSize, cfg.current.showGrid, cfg.current.legendMap, { completedRows: cfg.current.completedRows, selectedRow: cfg.current.selectedRow })
      cfg.current.onCommit(workRef.current)
      return
    }

    // 画笔 / 橡皮：进入拖拽模式
    drawingRef.current = true
    lastCellRef.current = [r, c]
    paint(r, c)
    scheduleRender()
    window.addEventListener('mousemove', handleWindowMove)
    window.addEventListener('mouseup', handleWindowUp)
  }

  const handleWindowMove = (e: MouseEvent) => {
    if (!drawingRef.current) return
    const cell = cellFromEvent(e)
    if (!cell) return
    const [r, c] = cell
    const last = lastCellRef.current
    if (last && (last[0] !== r || last[1] !== c)) {
      for (const [lr, lc] of lineCells(last[0], last[1], r, c)) paint(lr, lc)
    } else {
      paint(r, c)
    }
    lastCellRef.current = [r, c]
    scheduleRender()
  }

  const handleWindowUp = () => {
    if (!drawingRef.current) return
    drawingRef.current = false
    lastCellRef.current = null
    window.removeEventListener('mousemove', handleWindowMove)
    window.removeEventListener('mouseup', handleWindowUp)
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
    cfg.current.onCommit(workRef.current) // 提交一步历史，同步 React state
  }

  // 卸载清理
  useEffect(() => {
    return () => {
      window.removeEventListener('mousemove', handleWindowMove)
      window.removeEventListener('mouseup', handleWindowUp)
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const cursor = panMode ? 'grab' : guideMode ? 'pointer' : tool === 'eyedropper' ? 'copy' : 'crosshair'

  return (
    <canvas
      ref={canvasRef}
      onMouseDown={handleMouseDown}
      onContextMenu={(e) => e.preventDefault()}
      style={{ cursor, imageRendering: 'pixelated', touchAction: 'none' }}
      className="block rounded-md shadow-craft"
    />
  )
}
