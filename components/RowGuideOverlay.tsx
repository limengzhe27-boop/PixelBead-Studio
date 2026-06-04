'use client'

import type { RunSegment } from '../utils/runLengthEncoder'

interface Props {
  row: number
  total: number
  segments: RunSegment[]
  completed: boolean
  onToggleComplete: () => void
  onClose: () => void
  onStep: (delta: number) => void
}

/** 逐行施工指南底部浮层（v1.2 功能 7 + 完成标记功能 6）：显示某一行的游程序列。 */
export default function RowGuideOverlay({ row, total, segments, completed, onToggleComplete, onClose, onStep }: Props) {
  return (
    <div className="fixed bottom-[60px] left-0 right-0 z-30 border-t-2 border-ink bg-slate-0/95 px-4 py-2.5 backdrop-blur-sm animate-fade-up md:bottom-0 md:left-[54px] md:right-12 lg:right-[248px]">
      <div className="mb-1.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={onToggleComplete}
            title={completed ? '取消完成标记' : '标记本行已拼完'}
            className={`grid h-6 w-6 place-items-center rounded-md border-2 transition-colors ${
              completed ? 'border-green-600 bg-green-500 text-white' : 'border-slate-300 text-transparent hover:border-slate-500'
            }`}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5L20 6" /></svg>
          </button>
          <span className="tag font-bold text-white" style={{ backgroundColor: '#FF6B00' }}>第 {row + 1} 行</span>
          <span className="font-mono text-[11px] text-slate-600">共 {total} 行</span>
          <button onClick={() => onStep(-1)} disabled={row <= 0} className="grid h-6 w-6 place-items-center rounded-md text-slate-600 hover:bg-slate-100 disabled:opacity-30">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="m18 15-6-6-6 6" /></svg>
          </button>
          <button onClick={() => onStep(1)} disabled={row >= total - 1} className="grid h-6 w-6 place-items-center rounded-md text-slate-600 hover:bg-slate-100 disabled:opacity-30">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
          </button>
        </div>
        <button onClick={onClose} className="grid h-6 w-6 place-items-center rounded-md text-slate-600 hover:bg-slate-100">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
        </button>
      </div>
      <div className="scroll-thin flex items-center gap-1.5 overflow-x-auto pb-1">
        {segments.map((s, i) => (
          <span
            key={i}
            className={`flex shrink-0 items-center gap-1.5 rounded-lg border px-2 py-1 text-xs ${
              s.hex === null ? 'border-dashed border-slate-300 text-slate-500' : 'border-slate-200 bg-white text-slate-800'
            }`}
          >
            {s.hex && <span className="h-3.5 w-3.5 rounded-sm ring-1 ring-black/10" style={{ backgroundColor: s.hex }} />}
            {s.hex === null ? <span>空</span> : <span className="font-mono text-[11px]">{s.code}</span>}
            <span className="font-mono font-bold">×{s.count}</span>
          </span>
        ))}
      </div>
    </div>
  )
}
