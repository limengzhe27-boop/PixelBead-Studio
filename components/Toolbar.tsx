import type { ReactNode } from 'react'
import Tooltip from './Tooltip'

interface Props {
  onBack: () => void
  onUndo: () => void
  onRedo: () => void
  canUndo: boolean
  canRedo: boolean
  showGrid: boolean
  setShowGrid: (v: boolean) => void
  guideMode: boolean
  setGuideMode: (v: boolean) => void
  onFlipH: () => void
  onFlipV: () => void
  onRotate: () => void
  completedCount: number
  totalRows: number
  onExport: () => void
  onSettings: () => void
}

/** 编辑器顶部工具栏（PRD §4.3，固定高 50px） */
export default function Toolbar({
  onBack,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  showGrid,
  setShowGrid,
  guideMode,
  setGuideMode,
  onFlipH,
  onFlipV,
  onRotate,
  completedCount,
  totalRows,
  onExport,
  onSettings,
}: Props) {
  return (
    <header className="fixed inset-x-0 top-0 z-30 flex h-[50px] items-center justify-between gap-2 border-b-2 border-ink bg-slate-0/95 px-3 backdrop-blur-sm">
      {/* 左：返回 / 撤销 / 重做 */}
      <div className="flex items-center gap-1">
        <Tooltip title="返回设置" desc="以原图重新转换（当前编辑会清除）" side="bottom">
          <button onClick={onBack} className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm text-slate-700 transition-colors hover:bg-slate-50">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5m0 0 7 7m-7-7 7-7" />
            </svg>
            <span className="hidden sm:inline">返回设置</span>
          </button>
        </Tooltip>
        <span className="mx-1 h-5 w-px bg-slate-200" />
        <IconBtn title="撤销 (Ctrl+Z)" disabled={!canUndo} onClick={onUndo}>
          <path d="M9 14L4 9l5-5 M4 9h11a5 5 0 0 1 0 10h-1" />
        </IconBtn>
        <IconBtn title="重做 (Ctrl+Shift+Z)" disabled={!canRedo} onClick={onRedo}>
          <path d="M15 14l5-5-5-5 M20 9H9a5 5 0 0 0 0 10h1" />
        </IconBtn>
        <span className="mx-1 h-5 w-px bg-slate-200" />
        <IconBtn title="水平翻转" onClick={onFlipH}>
          <path d="M12 3v18M7 8l-3 4 3 4M17 8l3 4-3 4" />
        </IconBtn>
        <IconBtn title="垂直翻转" onClick={onFlipV}>
          <path d="M3 12h18M8 7l4-3 4 3M8 17l4 3 4-3" />
        </IconBtn>
        <IconBtn title="顺时针旋转 90°" onClick={onRotate}>
          <path d="M21 12a9 9 0 1 1-3-6.7M21 4v4h-4" />
        </IconBtn>
      </div>

      {/* 中：网格 + 逐行 */}
      <div className="flex items-center gap-2">
        <Tooltip title="网格" desc="显示 / 隐藏参考网格" side="bottom">
          <button
            onClick={() => setShowGrid(!showGrid)}
            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm transition-colors ${
              showGrid ? 'bg-slate-100 text-ink' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <path d="M9 3v18M15 3v18M3 9h18M3 15h18" />
            </svg>
            <span className="hidden lg:inline">网格</span>
          </button>
        </Tooltip>
        <Tooltip title="逐行施工指南" desc="开启后点画布任意一行，看该行色号与数量" side="bottom">
          <button
            onClick={() => setGuideMode(!guideMode)}
            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm transition-colors ${
              guideMode ? 'bg-coral text-white' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 6h13M3 12h18M3 18h10" />
            </svg>
            <span className="hidden lg:inline">逐行</span>
          </button>
        </Tooltip>
        {totalRows > 0 && (guideMode || completedCount > 0) && (
          <span className="hidden font-mono text-[11px] text-slate-600 md:inline">
            已完成 {completedCount} / {totalRows} 行（{Math.round((completedCount / totalRows) * 100)}%）
          </span>
        )}
      </div>

      {/* 右：AI 服务设置 + 导出 */}
      <div className="flex items-center gap-2">
        <Tooltip title="AI 服务设置" desc="配置图像生成 / 视觉 / 文本模型（BYOK）" side="bottom">
          <button onClick={onSettings} aria-label="AI 服务设置" className="grid h-8 w-8 place-items-center rounded-lg text-slate-700 transition-colors hover:bg-slate-50">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </button>
        </Tooltip>
        <Tooltip title="导出" desc="PDF（图纸+图例+逐行）或 PNG" side="bottom">
          <button onClick={onExport} className="btn-cta px-4 py-2 text-sm">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 3v12m0 0 4-4m-4 4-4-4M5 21h14" />
            </svg>
            导出
          </button>
        </Tooltip>
      </div>
    </header>
  )
}

function IconBtn({
  title,
  disabled,
  onClick,
  children,
}: {
  title: string
  disabled?: boolean
  onClick: () => void
  children: ReactNode
}) {
  return (
    <Tooltip title={title} side="bottom">
      <button
        aria-label={title}
        disabled={disabled}
        onClick={onClick}
        className="grid h-8 w-8 place-items-center rounded-lg text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent"
      >
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          {children}
        </svg>
      </button>
    </Tooltip>
  )
}
