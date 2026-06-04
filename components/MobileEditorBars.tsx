'use client'

import { useState } from 'react'
import type { ToolType } from '../types'

const ICONS: Record<string, JSX.Element> = {
  brush: <path d="M15.5 4.5l4 4L9 19l-4.5 1 1-4.5L15.5 4.5z M14 6l4 4" />,
  eraser: <path d="M4 16.5L13 7.5a2 2 0 0 1 3 0l4 4a2 2 0 0 1 0 3L17 18H8l-4-4z M9 19h11" />,
  bucket: <path d="M5 11l6-6 7 7-6 6a2 2 0 0 1-3 0l-4-4a2 2 0 0 1 0-3z M19 14s2 2.5 2 4a2 2 0 1 1-4 0c0-1.5 2-4 2-4z" />,
  eyedropper: <path d="M19 3a2.8 2.8 0 0 1 2 4.8l-8 8-4 1 1-4 8-8A2.8 2.8 0 0 1 19 3z M5 19l3-3" />,
  hand: <path d="M18 11V6a1.5 1.5 0 0 0-3 0V5a1.5 1.5 0 0 0-3 0 1.5 1.5 0 0 0-3 0v1.5a1.5 1.5 0 0 0-3 0V14a7 7 0 0 0 7 7h1a6 6 0 0 0 6-6v-3a1.5 1.5 0 0 0-3 0" />,
}

const Icon = ({ name }: { name: string }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    {ICONS[name]}
  </svg>
)

/** 手机端顶部栏（48px，fixed）：返回 / 产品名 / 撤销·重做·更多菜单 */
export function MobileTopBar({
  onBack,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  showGrid,
  setShowGrid,
  guideMode,
  setGuideMode,
  onExport,
  onSettings,
}: {
  onBack: () => void
  onUndo: () => void
  onRedo: () => void
  canUndo: boolean
  canRedo: boolean
  showGrid: boolean
  setShowGrid: (v: boolean) => void
  guideMode: boolean
  setGuideMode: (v: boolean) => void
  onExport: () => void
  onSettings: () => void
}) {
  const [more, setMore] = useState(false)
  return (
    <header className="fixed inset-x-0 top-0 z-40 flex h-12 items-center justify-between border-b-2 border-ink bg-slate-0/95 px-1.5 backdrop-blur-sm">
      <button onClick={onBack} aria-label="返回设置" className="touch-target grid place-items-center rounded-lg text-slate-700 active:bg-slate-100">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5m0 0 7 7m-7-7 7-7" /></svg>
      </button>
      <span className="font-display text-base font-extrabold tracking-tight text-ink">PixelBead</span>
      <div className="flex items-center">
        <button onClick={onUndo} disabled={!canUndo} aria-label="撤销" className="touch-target grid place-items-center rounded-lg text-slate-700 active:bg-slate-100 disabled:opacity-30">
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 14L4 9l5-5 M4 9h11a5 5 0 0 1 0 10h-1" /></svg>
        </button>
        <button onClick={onRedo} disabled={!canRedo} aria-label="重做" className="touch-target grid place-items-center rounded-lg text-slate-700 active:bg-slate-100 disabled:opacity-30">
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 14l5-5-5-5 M20 9H9a5 5 0 0 0 0 10h1" /></svg>
        </button>
        <div className="relative">
          <button onClick={() => setMore((v) => !v)} aria-label="更多" className="touch-target grid place-items-center rounded-lg text-slate-700 active:bg-slate-100">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="2" /><circle cx="12" cy="12" r="2" /><circle cx="19" cy="12" r="2" /></svg>
          </button>
          {more && (
            <>
              <div className="fixed inset-0 z-[1]" onClick={() => setMore(false)} />
              <div className="absolute right-0 top-full z-[2] mt-1 w-44 overflow-hidden rounded-xl border-2 border-ink bg-slate-0 shadow-pop animate-pop-in">
                <MenuItem label="网格显示" active={showGrid} onClick={() => { setShowGrid(!showGrid); setMore(false) }} />
                <MenuItem label="逐行施工指南" active={guideMode} onClick={() => { setGuideMode(!guideMode); setMore(false) }} />
                <button onClick={() => { onSettings(); setMore(false) }} className="flex w-full items-center gap-2 border-t border-slate-100 px-3.5 py-3 text-left text-sm text-slate-800 active:bg-slate-50">
                  ⚙️ AI 服务设置
                </button>
                <button onClick={() => { onExport(); setMore(false) }} className="flex w-full items-center gap-2 border-t border-slate-100 px-3.5 py-3 text-left text-sm font-bold text-coral active:bg-slate-50">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v12m0 0 4-4m-4 4-4-4M5 21h14" /></svg>
                  导出图纸
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  )
}

function MenuItem({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex w-full items-center justify-between px-3.5 py-3 text-left text-sm text-slate-800 active:bg-slate-50">
      {label}
      <span className={`h-4 w-4 rounded-full border-2 ${active ? 'border-coral bg-coral' : 'border-slate-300'}`} />
    </button>
  )
}

/** 手机端底部工具栏（60px，fixed）：画笔/橡皮/油漆桶/取色/手型 + 颜色面板/用豆清单 */
export function MobileToolbar({
  tool,
  setTool,
  color,
  onOpenColor,
  onOpenLegend,
}: {
  tool: ToolType
  setTool: (t: ToolType) => void
  color: string
  onOpenColor: () => void
  onOpenLegend: () => void
}) {
  const tools: { t: ToolType; name: string }[] = [
    { t: 'brush', name: '画笔' },
    { t: 'eraser', name: '橡皮' },
    { t: 'bucket', name: '填充' },
    { t: 'eyedropper', name: '取色' },
    { t: 'hand', name: '平移' },
  ]
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 grid h-[60px] grid-cols-7 border-t-2 border-ink bg-slate-0/95 backdrop-blur-sm">
      {tools.map(({ t, name }) => {
        const active = tool === t
        return (
          <button
            key={t}
            onClick={() => setTool(t)}
            aria-label={name}
            className={`flex flex-col items-center justify-center gap-0.5 transition-colors ${active ? 'bg-coral text-white' : 'text-slate-700 active:bg-slate-100'}`}
          >
            <Icon name={t} />
            <span className="text-[10px] leading-none">{name}</span>
          </button>
        )
      })}
      <button onClick={onOpenColor} aria-label="颜色板" className="flex flex-col items-center justify-center gap-0.5 text-slate-700 active:bg-slate-100">
        <span className="h-[22px] w-[22px] rounded-full border-2 border-white shadow-peg ring-1 ring-slate-300" style={{ backgroundColor: color }} />
        <span className="text-[10px] leading-none">颜色</span>
      </button>
      <button onClick={onOpenLegend} aria-label="用豆清单" className="flex flex-col items-center justify-center gap-0.5 text-slate-700 active:bg-slate-100">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" /></svg>
        <span className="text-[10px] leading-none">清单</span>
      </button>
    </nav>
  )
}
