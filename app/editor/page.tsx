'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { MouseEvent as ReactMouseEvent } from 'react'
import { useRouter } from 'next/navigation'
import { useProject } from '@/context/ProjectContext'
import { useSettings } from '@/context/SettingsContext'
import Toolbar from '@/components/Toolbar'
import ToolPanel from '@/components/ToolPanel'
import PalettePanel from '@/components/PalettePanel'
import LegendPanel from '@/components/LegendPanel'
import EditorCanvas from '@/components/EditorCanvas'
import ExportModal from '@/components/ExportModal'
import RowGuideOverlay from '@/components/RowGuideOverlay'
import ColorSubstituter from '@/components/ColorSubstituter'
import EditorGuide from '@/components/EditorGuide'
import Sheet from '@/components/Sheet'
import { MobileTopBar, MobileToolbar } from '@/components/MobileEditorBars'
import { useIsMobile, useIsTablet } from '@/hooks/useMediaQuery'
import { buildLegend, buildLegendMap } from '@/utils/legendBuilder'
import { encodeRow } from '@/utils/runLengthEncoder'
import { exportPDF, exportPNG } from '@/utils/pdfExporter'
import { BRANDS, getBrand } from '@/data/brands'
import { hexToRgb, snapToArtkal } from '@/utils/imageProcessor'
import type { ColorEntry, LegendItem, PixelGrid, ToolType } from '@/types'

const CELL_SIZE = 16 // 渲染固定 16px/格，缩放走 CSS transform（渲染质量最佳）
const MIN_ZOOM = 0.25
const MAX_ZOOM = 4
const clampZoom = (z: number) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, z))

export default function EditorPage() {
  const { state, dispatch, canUndo, canRedo } = useProject()
  const router = useRouter()
  const { openSettings } = useSettings()

  const [tool, setTool] = useState<ToolType>('brush')
  const [color, setColor] = useState('#212121')
  const [scale, setScale] = useState(1)
  const [translateX, setTranslateX] = useState(0)
  const [translateY, setTranslateY] = useState(0)
  const [spaceHeld, setSpaceHeld] = useState(false)
  const [panning, setPanning] = useState(false)
  const [showGrid, setShowGrid] = useState(true)
  const [exportOpen, setExportOpen] = useState(false)
  const [exporting, setExporting] = useState<'pdf' | 'png' | null>(null)
  const [exportError, setExportError] = useState<string | null>(null)
  const [guideMode, setGuideMode] = useState(false)
  const [selectedRow, setSelectedRow] = useState<number | null>(null)
  const [substituteHex, setSubstituteHex] = useState<string | null>(null)
  const [showGuide, setShowGuide] = useState(false)
  const [brand, setBrand] = useState('artkal-midi')
  const [brushSize, setBrushSize] = useState(1)
  const [completedRows, setCompletedRows] = useState<Set<number>>(() => new Set())
  const [colorOpen, setColorOpen] = useState(true)
  const [legendOpen, setLegendOpen] = useState(true)
  const [vpH, setVpH] = useState(0) // 画布视口高度，用于左侧行号列定位

  // 响应式：断点 + 平板浮动面板 / 手机底部抽屉
  const isMobile = useIsMobile()
  const isTablet = useIsTablet()
  const [tabletPanel, setTabletPanel] = useState<null | 'color' | 'legend'>(null)
  const [colorSheet, setColorSheet] = useState(false)
  const [legendSheet, setLegendSheet] = useState(false)
  const [recNotice, setRecNotice] = useState(false) // 来自「识别色号」的一次性提示

  const viewportRef = useRef<HTMLDivElement>(null)
  const scaleRef = useRef(1)
  const txRef = useRef(0)
  const tyRef = useRef(0)
  const spaceRef = useRef(false)
  const panModeRef = useRef(false)

  const pixels = state.pixels
  const palette = useMemo(() => getBrand(brand).palette, [brand])
  const legend = useMemo(() => buildLegend(pixels ?? [], palette), [pixels, palette])
  const legendMap = useMemo(() => buildLegendMap(legend), [legend])
  const isEmpty = useMemo(() => !!pixels && pixels.every((row) => row.every((c) => c === null)), [pixels])
  const beadsTotal = useMemo(() => legend.reduce((s, it) => s + it.count, 0), [legend])
  const colorsTotal = legend.length

  // 路由保护：无像素 → 回首页
  useEffect(() => {
    if (!state.pixels) router.replace('/')
  }, [state.pixels, router])

  // 首次进入编辑器 → 显示引导层（localStorage 记忆，只读一次，避免 SSR）
  useEffect(() => {
    try {
      if (!localStorage.getItem('pixelbead_editor_guide_seen')) setShowGuide(true)
    } catch {
      /* localStorage 不可用时忽略 */
    }
  }, [])

  // 测量画布视口高度（左侧行号列按 scale/translateY 定位时需要），随窗口变化更新
  useEffect(() => {
    const measure = () => setVpH(viewportRef.current?.clientHeight ?? 0)
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [])

  // 从「识别色号」进入 → 显示一次性「结果仅供参考」提示
  useEffect(() => {
    try {
      if (sessionStorage.getItem('pixelbead_from_recognize')) setRecNotice(true)
    } catch {
      /* ignore */
    }
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA') return
      if (e.code === 'Space') {
        e.preventDefault() // 空格按住 → 平移模式（避免页面滚动）
        if (!spaceRef.current) {
          spaceRef.current = true
          setSpaceHeld(true)
        }
        return
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault()
        dispatch({ type: e.shiftKey ? 'REDO' : 'UNDO' })
        return
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault()
        dispatch({ type: 'REDO' })
        return
      }
      if (e.metaKey || e.ctrlKey) return
      switch (e.key.toLowerCase()) {
        case 'b': setTool('brush'); break
        case 'e': setTool('eraser'); break
        case 'f': setTool('bucket'); break
        case 'i': setTool('eyedropper'); break
        case 'w': setTool('magicEraser'); break
        case 'h': setTool('hand'); break
      }
    }
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        spaceRef.current = false
        setSpaceHeld(false)
      }
    }
    window.addEventListener('keydown', onKey)
    window.addEventListener('keyup', onKeyUp)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('keyup', onKeyUp)
    }
  }, [dispatch])

  // ===== 缩放 + 平移（模块2/3）：scale + translate，flex 居中，cellSize 固定 16 =====
  const setView = useCallback((s: number, tx: number, ty: number) => {
    scaleRef.current = s
    txRef.current = tx
    tyRef.current = ty
    setScale(s)
    setTranslateX(tx)
    setTranslateY(ty)
  }, [])

  // 以 (mx,my) 为中心缩放：保持该点下的画布位置不动（transform-origin: center）
  const zoomTo = useCallback(
    (s1raw: number, mx: number, my: number) => {
      const el = viewportRef.current
      if (!el) return
      const r = el.getBoundingClientRect()
      const cx = r.left + r.width / 2
      const cy = r.top + r.height / 2
      const s0 = scaleRef.current
      const s1 = clampZoom(s1raw)
      if (s1 === s0) return
      const f = s1 / s0
      setView(s1, (mx - cx) * (1 - f) + txRef.current * f, (my - cy) * (1 - f) + tyRef.current * f)
    },
    [setView],
  )

  const panBy = useCallback((dx: number, dy: number) => setView(scaleRef.current, txRef.current + dx, tyRef.current + dy), [setView])

  // 进入编辑器 / 画布尺寸变化 → 自动适配视口并居中（小图也铺满，充分利用空间；尺寸不变时不重置用户缩放）
  const fitSigRef = useRef('')
  useEffect(() => {
    const px = state.pixels
    const el = viewportRef.current
    if (!px || !el) return
    const cols = px[0]?.length ?? 0
    const rows = px.length
    if (!cols || !rows) return
    const sig = `${cols}x${rows}`
    if (fitSigRef.current === sig) return // 仅在尺寸首次出现/改变时适配
    const vw = el.clientWidth
    const vh = el.clientHeight
    if (!vw || !vh) return
    fitSigRef.current = sig
    const s = clampZoom(Math.min((vw * 0.9) / (cols * CELL_SIZE), (vh * 0.9) / (rows * CELL_SIZE)))
    setView(s, 0, 0)
  }, [state.pixels, vpH, setView])

  // 原生非 passive：双指/滚轮平移 · Ctrl⌘+滚轮 或 触控板捏合 缩放 + 触屏双指捏合 + 手型单指平移
  useEffect(() => {
    const el = viewportRef.current
    if (!el) return
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      // deltaMode 归一：行模式(Firefox 鼠标)/页模式按像素换算，否则缩放/平移几乎不动
      const unit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? el.clientHeight || 800 : 1
      const dx = e.deltaX * unit
      const dy = e.deltaY * unit
      // Ctrl/⌘+滚轮 或 触控板捏合(浏览器以 ctrlKey 上报) → 以光标为中心缩放；否则双指/滚轮平移
      if (e.ctrlKey || e.metaKey) zoomTo(scaleRef.current * (1 - dy * 0.003), e.clientX, e.clientY)
      else panBy(-dx, -dy)
    }
    let startDist = 0
    let startScale = 1
    let pinching = false
    let panTouch: { x: number; y: number; tx: number; ty: number } | null = null
    const distOf = (t: TouchList) => Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY)
    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        pinching = true
        startDist = distOf(e.touches)
        startScale = scaleRef.current
      } else if (e.touches.length === 1 && panModeRef.current) {
        panTouch = { x: e.touches[0].clientX, y: e.touches[0].clientY, tx: txRef.current, ty: tyRef.current }
      }
    }
    const onTouchMove = (e: TouchEvent) => {
      if (pinching && e.touches.length === 2 && startDist > 0) {
        e.preventDefault()
        const d = distOf(e.touches)
        const mx = (e.touches[0].clientX + e.touches[1].clientX) / 2
        const my = (e.touches[0].clientY + e.touches[1].clientY) / 2
        zoomTo(startScale * (d / startDist), mx, my)
      } else if (panTouch && e.touches.length === 1) {
        e.preventDefault()
        setView(scaleRef.current, panTouch.tx + (e.touches[0].clientX - panTouch.x), panTouch.ty + (e.touches[0].clientY - panTouch.y))
      }
    }
    const onTouchEnd = (e: TouchEvent) => {
      if (e.touches.length < 2) pinching = false
      if (e.touches.length === 0) panTouch = null
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    el.addEventListener('touchstart', onTouchStart, { passive: false })
    el.addEventListener('touchmove', onTouchMove, { passive: false })
    el.addEventListener('touchend', onTouchEnd)
    return () => {
      el.removeEventListener('wheel', onWheel)
      el.removeEventListener('touchstart', onTouchStart)
      el.removeEventListener('touchmove', onTouchMove)
      el.removeEventListener('touchend', onTouchEnd)
    }
  }, [zoomTo, panBy, setView])

  if (!pixels) return null

  const handleBack = () => {
    const dirty = canUndo
    if (dirty && !window.confirm('返回设置会以原图重新转换，当前编辑内容将丢失。确定返回吗？')) return
    if (state.sourceImage) {
      router.push('/convert')
    } else {
      dispatch({ type: 'RESET' })
      router.push('/')
    }
  }

  const onCommit = (grid: PixelGrid) => dispatch({ type: 'COMMIT_EDIT', payload: grid })
  // 行定位：点击格子 / 逐行浮层 → 选中该行高亮；再次点击同一行 → 取消（selectedRow = null）
  const locateRow = (r: number) => setSelectedRow((prev) => (prev === r ? null : r))
  const onPickColor = (hex: string) => {
    setColor(hex)
    setTool('brush')
  }
  const closeGuide = () => {
    setShowGuide(false)
    try {
      localStorage.setItem('pixelbead_editor_guide_seen', '1')
    } catch {
      /* ignore */
    }
  }

  // 功能1：切换品牌 → 全图重 snap 到新色卡最近色 + 当前色重 snap，入撤销栈
  const switchBrand = (id: string) => {
    setBrand(id)
    const pal = getBrand(id).palette
    if (pixels) {
      const resnapped = pixels.map((row) =>
        row.map((cell) => {
          if (!cell) return null
          const { r, g, b } = hexToRgb(cell)
          return snapToArtkal(r, g, b, pal)
        }),
      )
      dispatch({ type: 'COMMIT_EDIT', payload: resnapped })
    }
    const cur = hexToRgb(color)
    setColor(snapToArtkal(cur.r, cur.g, cur.b, pal))
  }

  // 功能5：翻转 / 旋转，入撤销栈；变换后清空逐行完成标记（行已变化）
  const applyTransform = (next: PixelGrid, cols: number, rows: number) => {
    dispatch({ type: 'SET_TRANSFORM', payload: { pixels: next, cols, rows } })
    setSelectedRow(null)
    setCompletedRows(new Set())
  }
  const flipH = () => applyTransform(pixels.map((row) => [...row].reverse()), pixels[0].length, pixels.length)
  const flipV = () => applyTransform([...pixels].reverse(), pixels[0].length, pixels.length)
  const rotateCW = () => {
    const R = pixels.length
    const C = pixels[0].length
    const ng: PixelGrid = Array.from({ length: C }, () => Array<string | null>(R).fill(null))
    for (let r = 0; r < R; r++) for (let c = 0; c < C; c++) ng[c][R - 1 - r] = pixels[r][c]
    applyTransform(ng, R, C) // 顺时针 90°，宽高互换
  }

  // 功能6：标记 / 取消某行完成
  const toggleRowComplete = (row: number) => {
    setCompletedRows((prev) => {
      const n = new Set(prev)
      if (n.has(row)) n.delete(row)
      else n.add(row)
      return n
    })
  }

  const zoomAtCenter = (s1: number) => {
    const el = viewportRef.current
    if (!el) return
    const r = el.getBoundingClientRect()
    zoomTo(s1, r.left + r.width / 2, r.top + r.height / 2)
  }
  const resetView = () => setView(1, 0, 0)

  const panMode = tool === 'hand' || spaceHeld
  panModeRef.current = panMode

  // 中键 / 平移模式（手型或空格）下鼠标拖拽 = 平移
  const startMousePan = (e: ReactMouseEvent) => {
    if (e.button !== 1 && !panMode) return
    e.preventDefault()
    setPanning(true)
    const sx = e.clientX
    const sy = e.clientY
    const tx0 = txRef.current
    const ty0 = tyRef.current
    const move = (ev: MouseEvent) => setView(scaleRef.current, tx0 + (ev.clientX - sx), ty0 + (ev.clientY - sy))
    const up = () => {
      setPanning(false)
      window.removeEventListener('mousemove', move)
      window.removeEventListener('mouseup', up)
    }
    window.addEventListener('mousemove', move)
    window.addEventListener('mouseup', up)
  }

  const meta = { cols: pixels[0]?.length ?? 0, rows: pixels.length }
  const naturalW = meta.cols * CELL_SIZE
  const naturalH = meta.rows * CELL_SIZE

  const doExportPDF = async () => {
    setExportError(null)
    setExporting('pdf')
    try {
      await exportPDF(pixels, legend, meta)
      setExportOpen(false)
    } catch (e) {
      setExportError(e instanceof Error ? e.message : 'PDF 导出失败，请重试')
    } finally {
      setExporting(null)
    }
  }
  const doExportPNG = async () => {
    setExportError(null)
    setExporting('png')
    try {
      await exportPNG(pixels)
      setExportOpen(false)
    } catch (e) {
      setExportError(e instanceof Error ? e.message : 'PNG 导出失败，请重试')
    } finally {
      setExporting(null)
    }
  }

  const onExportOpen = () => {
    setExportError(null)
    setExportOpen(true)
  }
  const setGuide = (v: boolean) => {
    setGuideMode(v)
    if (!v) setSelectedRow(null)
  }
  const dismissRecNotice = () => {
    try {
      sessionStorage.removeItem('pixelbead_from_recognize')
    } catch {
      /* ignore */
    }
    setRecNotice(false)
  }

  return (
    <div className="h-screen overflow-hidden bg-slate-50">
      {/* ===== 顶部栏：手机端精简 48px / 桌面·平板沿用工具栏 ===== */}
      {isMobile ? (
        <MobileTopBar
          onBack={handleBack}
          onUndo={() => dispatch({ type: 'UNDO' })}
          onRedo={() => dispatch({ type: 'REDO' })}
          canUndo={canUndo}
          canRedo={canRedo}
          showGrid={showGrid}
          setShowGrid={setShowGrid}
          guideMode={guideMode}
          setGuideMode={setGuide}
          onExport={onExportOpen}
          onSettings={openSettings}
        />
      ) : (
        <Toolbar
          onBack={handleBack}
          onUndo={() => dispatch({ type: 'UNDO' })}
          onRedo={() => dispatch({ type: 'REDO' })}
          canUndo={canUndo}
          canRedo={canRedo}
          showGrid={showGrid}
          setShowGrid={setShowGrid}
          guideMode={guideMode}
          setGuideMode={setGuide}
          onFlipH={flipH}
          onFlipV={flipV}
          onRotate={rotateCW}
          completedCount={completedRows.size}
          totalRows={meta.rows}
          onExport={onExportOpen}
          onSettings={openSettings}
        />
      )}

      {/* 识别色号进入 → 一次性提示（toast，可关闭） */}
      {recNotice && (
        <div className="fixed inset-x-2 top-14 z-[45] mx-auto flex max-w-md items-start gap-2 rounded-xl border-2 border-ink bg-sun px-3.5 py-2.5 shadow-pop animate-fade-up md:inset-x-auto md:right-4 md:top-[58px]">
          <span className="flex-1 text-[13px] leading-snug text-ink">
            💡 成品转图纸结果仅供参考，准确率受照片质量影响。建议检查颜色是否正确，可用画笔或色号替换功能修正。
          </span>
          <button onClick={dismissRecNotice} aria-label="知道了" className="shrink-0 rounded-md p-1 text-ink/70 transition-colors hover:bg-black/10">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
          </button>
        </div>
      )}

      {/* ===== 左侧工具栏（桌面 + 平板；手机用底部栏） ===== */}
      <div className="fixed bottom-0 left-0 top-[50px] z-20 hidden md:block">
        <ToolPanel tool={tool} setTool={setTool} color={color} palette={palette} brushSize={brushSize} setBrushSize={setBrushSize} />
      </div>

      {/* 画布视口：flex 居中 + translate/scale 变换（模块2/3）。insets 响应式：
          手机 上48/下60/左右0；平板 上50/左54/右48(图标dock)/下0；桌面 右248(面板) */}
      <div
        ref={viewportRef}
        onMouseDown={startMousePan}
        className="fixed bottom-[60px] left-0 right-0 top-12 flex items-center justify-center overflow-hidden bg-pegboard-fine md:bottom-0 md:left-[54px] md:right-12 md:top-[50px] lg:right-[248px]"
        style={{ cursor: panMode ? (panning ? 'grabbing' : 'grab') : 'default', touchAction: 'none' }}
      >
        <div
          style={{
            width: naturalW,
            height: naturalH,
            transform: `translate(${translateX}px, ${translateY}px) scale(${scale})`,
            transformOrigin: 'center',
          }}
        >
          <EditorCanvas
            pixels={pixels}
            cellSize={CELL_SIZE}
            showGrid={showGrid}
            legendMap={legendMap}
            tool={tool}
            color={color}
            onCommit={onCommit}
            onPickColor={onPickColor}
            guideMode={guideMode}
            onSelectRow={locateRow}
            selectedRow={selectedRow}
            brushSize={brushSize}
            completedRows={completedRows}
            panMode={panMode}
          />
        </div>
      </div>

      {/* 左侧常驻行号列（桌面 + 平板；手机隐藏，避免与画布争位） */}
      {!isMobile && <RowGutter rows={meta.rows} scale={scale} translateY={translateY} vpH={vpH} selectedRow={selectedRow} />}

      {/* ===== 右侧面板（桌面 ≥1024 固定 248px） ===== */}
      <div className="fixed bottom-0 right-0 top-[50px] z-20 hidden w-[248px] flex-col border-l-2 border-ink bg-slate-0 lg:flex">
        {/* 品牌选择器（常驻） */}
        <div className="flex shrink-0 items-center gap-2 border-b border-slate-100 px-3.5 py-2.5">
          <span className="shrink-0 text-xs text-slate-600">品牌</span>
          <select
            value={brand}
            onChange={(e) => switchBrand(e.target.value)}
            className="flex-1 cursor-pointer rounded-lg border border-slate-200 bg-slate-0 px-2 py-1.5 text-sm text-slate-800 outline-none focus:border-coral"
          >
            {BRANDS.map((bd) => (
              <option key={bd.id} value={bd.id}>
                {bd.label}（{bd.mm}）
              </option>
            ))}
          </select>
        </div>

        {/* 模块1：手风琴式折叠 —— 自然从上往下堆叠，整体滚动；折叠某区块只收起其内容，标题不跳位 */}
        <div className="scroll-thin min-h-0 flex-1 overflow-y-auto">
          <SectionHeader icon="🎨" title="颜色板" extra={`${palette.length} 色`} open={colorOpen} onToggle={() => setColorOpen((v) => !v)} />
          {colorOpen && <PalettePanel color={color} setColor={setColor} palette={palette} />}

          <SectionHeader icon="📋" title="用豆清单" extra={`${colorsTotal} 色 · ${beadsTotal} 颗`} open={legendOpen} onToggle={() => setLegendOpen((v) => !v)} />
          {legendOpen && (
            <>
              <LegendPanel legend={legend} onReplace={setSubstituteHex} />
              <PegboardInfo cols={meta.cols} rows={meta.rows} />
            </>
          )}

          {!colorOpen && !legendOpen && (
            <div className="px-4 py-6 text-center">
              <span className="text-xs text-slate-400">共 {beadsTotal} 颗豆 · {colorsTotal} 种颜色</span>
            </div>
          )}
        </div>
      </div>

      {/* ===== 平板（768–1023）：右侧图标 dock + 浮动面板 ===== */}
      {isTablet && (
        <>
          <div className="fixed bottom-0 right-0 top-[50px] z-20 flex w-12 flex-col items-center gap-2 border-l-2 border-ink bg-slate-0 py-3">
            <DockBtn emoji="🎨" label="颜色板" active={tabletPanel === 'color'} onClick={() => setTabletPanel(tabletPanel === 'color' ? null : 'color')} />
            <DockBtn emoji="📋" label="用豆清单" active={tabletPanel === 'legend'} onClick={() => setTabletPanel(tabletPanel === 'legend' ? null : 'legend')} />
          </div>
          <Sheet
            open={tabletPanel !== null}
            onClose={() => setTabletPanel(null)}
            side="right"
            widthPx={300}
            title={tabletPanel === 'legend' ? '用豆清单' : '颜色板'}
            icon={tabletPanel === 'legend' ? '📋' : '🎨'}
          >
            {tabletPanel === 'legend' ? (
              <LegendPanelBody cols={meta.cols} rows={meta.rows} legend={legend} onReplace={setSubstituteHex} />
            ) : (
              <ColorPanelBody brand={brand} switchBrand={switchBrand} palette={palette} color={color} setColor={setColor} />
            )}
          </Sheet>
        </>
      )}

      {/* ===== 手机（<768）：底部工具栏 + 颜色/清单底部抽屉 ===== */}
      {isMobile && (
        <>
          <MobileToolbar tool={tool} setTool={setTool} color={color} onOpenColor={() => setColorSheet(true)} onOpenLegend={() => setLegendSheet(true)} />
          <Sheet open={colorSheet} onClose={() => setColorSheet(false)} side="bottom" heightVh={60} title="颜色板" icon="🎨">
            <ColorPanelBody brand={brand} switchBrand={switchBrand} palette={palette} color={color} setColor={setColor} />
          </Sheet>
          <Sheet open={legendSheet} onClose={() => setLegendSheet(false)} side="bottom" heightVh={70} title="用豆清单" icon="📋">
            <LegendPanelBody cols={meta.cols} rows={meta.rows} legend={legend} onReplace={setSubstituteHex} />
          </Sheet>
        </>
      )}

      <ExportModal
        open={exportOpen}
        onClose={() => (exporting ? null : setExportOpen(false))}
        onPDF={doExportPDF}
        onPNG={doExportPNG}
        exporting={exporting}
        error={exportError}
      />

      {/* 行定位 / 逐行：选中任一行即显示该行施工序列（不再要求开启逐行模式） */}
      {selectedRow !== null && pixels[selectedRow] && (
        <RowGuideOverlay
          row={selectedRow}
          total={pixels.length}
          segments={encodeRow(pixels[selectedRow], palette)}
          completed={completedRows.has(selectedRow)}
          onToggleComplete={() => toggleRowComplete(selectedRow)}
          onClose={() => setSelectedRow(null)}
          onStep={(d) => setSelectedRow((r) => Math.max(0, Math.min(pixels.length - 1, (r ?? 0) + d)))}
        />
      )}

      {/* 逐行模式已开但未选行 → 提示如何使用（避免「点了逐行没反应」的困惑） */}
      {guideMode && selectedRow === null && (
        <div className="pointer-events-none fixed bottom-[68px] left-0 right-0 z-30 flex justify-center px-3 md:bottom-4 md:left-[54px] md:right-12 lg:right-[248px]">
          <span className="rounded-bead bg-coral px-3.5 py-1.5 text-center text-xs font-bold text-white shadow-sticker-sm">
            👆 点击画布上任意一行，查看该行每个色号与数量
          </span>
        </div>
      )}

      {substituteHex && (
        <ColorSubstituter
          fromHex={substituteHex}
          palette={palette}
          onReplace={(to) => {
            dispatch({ type: 'REPLACE_COLOR', payload: { from: substituteHex, to } })
            setSubstituteHex(null)
          }}
          onClose={() => setSubstituteHex(null)}
        />
      )}

      {/* 画布空状态提示（全空时居中，浅灰、不挡操作，有内容后消失） */}
      {isEmpty && (
        <div className="pointer-events-none fixed bottom-[60px] left-0 right-0 top-12 z-10 grid place-items-center md:bottom-0 md:left-[54px] md:right-12 md:top-[50px] lg:right-[248px]">
          <p className="mx-3 rounded-xl bg-slate-0/75 px-4 py-2 text-center text-sm text-slate-400 backdrop-blur-sm">
            选择画笔工具，点击格子开始绘制
          </p>
        </div>
      )}

      {/* 首次进入编辑器引导层 */}
      {showGuide && <EditorGuide onClose={closeGuide} />}

      {/* 右下角悬浮缩放控件 + 操作说明（桌面/平板；手机用双指捏合，故隐藏）；容器 pointer-events-none，避免遮挡画布点击 */}
      <div className="pointer-events-none fixed bottom-5 right-16 z-30 hidden flex-col items-center gap-1 md:flex lg:right-[268px]">
        <div className="pointer-events-auto flex items-center gap-0.5 rounded-2xl border border-slate-200 bg-slate-0/95 px-1.5 py-1 shadow-soft backdrop-blur-sm">
          <button onClick={() => zoomAtCenter(scaleRef.current - 0.25)} title="缩小 25%" className="grid h-7 w-7 place-items-center rounded-lg text-slate-700 transition-colors hover:bg-slate-100">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M5 12h14" /></svg>
          </button>
          <button onClick={resetView} title="重置 100% 并居中" className="min-w-[46px] rounded-lg px-1.5 py-1 text-center font-mono text-xs font-bold text-slate-700 transition-colors hover:bg-slate-100">
            {Math.round(scale * 100)}%
          </button>
          <button onClick={() => zoomAtCenter(scaleRef.current + 0.25)} title="放大 25%" className="grid h-7 w-7 place-items-center rounded-lg text-slate-700 transition-colors hover:bg-slate-100">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
          </button>
        </div>
        <span className="select-none text-[11px]" style={{ color: '#999' }}>
          缩放：捏合 / Ctrl+滚轮 · 平移：滚动 / 拖拽
        </span>
      </div>
    </div>
  )
}

/** 平板浮动面板 / 手机底部抽屉复用：颜色面板主体（品牌选择 + 色盘） */
function ColorPanelBody({
  brand,
  switchBrand,
  palette,
  color,
  setColor,
}: {
  brand: string
  switchBrand: (id: string) => void
  palette: ColorEntry[]
  color: string
  setColor: (hex: string) => void
}) {
  return (
    <>
      <div className="flex items-center gap-2 border-b border-slate-100 px-3.5 py-2.5">
        <span className="shrink-0 text-xs text-slate-600">品牌</span>
        <select
          value={brand}
          onChange={(e) => switchBrand(e.target.value)}
          className="min-h-[40px] flex-1 cursor-pointer rounded-lg border border-slate-200 bg-slate-0 px-2 py-1.5 text-sm text-slate-800 outline-none focus:border-coral"
        >
          {BRANDS.map((bd) => (
            <option key={bd.id} value={bd.id}>
              {bd.label}（{bd.mm}）
            </option>
          ))}
        </select>
      </div>
      <PalettePanel color={color} setColor={setColor} palette={palette} />
    </>
  )
}

/** 平板浮动面板 / 手机底部抽屉复用：用豆清单主体（拼盘参考 + 用量列表） */
function LegendPanelBody({
  cols,
  rows,
  legend,
  onReplace,
}: {
  cols: number
  rows: number
  legend: LegendItem[]
  onReplace: (hex: string) => void
}) {
  return (
    <>
      <PegboardInfo cols={cols} rows={rows} />
      <LegendPanel legend={legend} onReplace={onReplace} />
    </>
  )
}

/** 平板右侧图标 dock 按钮 */
function DockBtn({ emoji, label, active, onClick }: { emoji: string; label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={`grid h-11 w-11 place-items-center rounded-xl text-xl transition-colors ${active ? 'bg-coral/15 ring-2 ring-coral' : 'hover:bg-slate-100'}`}
    >
      {emoji}
    </button>
  )
}

/**
 * 左侧常驻行号列：HTML 叠加（position: fixed，不入 canvas），每 5 行标一次。
 * 文字大小不随画布缩放变化，但每行垂直位置随 scale / translateY 同步计算。
 */
function RowGutter({
  rows,
  scale,
  translateY,
  vpH,
  selectedRow,
}: {
  rows: number
  scale: number
  translateY: number
  vpH: number
  selectedRow: number | null
}) {
  if (vpH <= 0 || rows <= 0) return null
  const cellPx = CELL_SIZE * scale
  // 画布在视口内 flex 居中后再 translate：画布顶边相对视口顶的 y
  const canvasTop = vpH / 2 + translateY - (rows * cellPx) / 2
  const items: { n: number; y: number; sel: boolean }[] = []
  for (let n = 1; n <= rows; n++) {
    if (n !== 1 && n % 5 !== 0) continue // 第 1、5、10、15… 行
    const y = canvasTop + (n - 0.5) * cellPx // 该行中心相对视口顶
    if (y < -10 || y > vpH + 10) continue // 视口外不渲染
    items.push({ n, y, sel: n - 1 === selectedRow })
  }
  return (
    <div className="pointer-events-none fixed bottom-0 left-[54px] top-[50px] z-20 w-8">
      {items.map((it) => (
        <span
          key={it.n}
          className={`absolute right-1 -translate-y-1/2 font-mono leading-none ${it.sel ? 'font-bold' : ''}`}
          style={{ top: it.y, color: it.sel ? '#FF6B00' : '#999', fontSize: it.sel ? 12 : 11 }}
        >
          {it.n}
        </span>
      ))}
    </div>
  )
}

/** 功能4：拼盘数量参考（Artkal 标准拼盘 29×29 孔） */
function PegboardInfo({ cols, rows }: { cols: number; rows: number }) {
  const bx = Math.ceil(cols / 29)
  const by = Math.ceil(rows / 29)
  return (
    <div className="shrink-0 border-t border-slate-100 px-3.5 py-3">
      <div className="mb-1 flex items-center gap-1.5 text-xs font-medium text-slate-700">
        <span>📐</span> 拼盘参考
      </div>
      <div className="space-y-0.5 text-[11px] text-slate-600">
        <div>
          图纸：<span className="font-mono text-slate-800">{cols}×{rows}</span> 格
        </div>
        <div>
          建议：<span className="font-mono text-slate-800">{bx}×{by}</span> 块拼盘
        </div>
        <div>
          共需：<span className="font-mono font-bold text-ink">{bx * by}</span> 块（29×29）
        </div>
      </div>
      <p className="mt-1.5 text-[10px] leading-snug text-slate-500">不同品牌拼盘规格略有差异，以实物为准</p>
    </div>
  )
}

/** 模块1：可折叠区块标题栏 */
function SectionHeader({
  icon,
  title,
  extra,
  open,
  onToggle,
}: {
  icon: string
  title: string
  extra?: string
  open: boolean
  onToggle: () => void
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="flex shrink-0 items-center justify-between border-b border-slate-100 bg-slate-0 px-3.5 py-2.5 text-left transition-colors hover:bg-slate-50"
    >
      <span className="flex items-center gap-1.5 text-xs font-medium text-slate-700">
        <span>{icon}</span>
        {title}
        {extra && <span className="font-mono text-[10px] font-normal text-slate-500">{extra}</span>}
      </span>
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={`text-slate-500 transition-transform ${open ? '' : '-rotate-90'}`}
      >
        <path d="m6 9 6 6 6-6" />
      </svg>
    </button>
  )
}
