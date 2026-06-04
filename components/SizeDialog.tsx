'use client'

import { useState } from 'react'

interface Props {
  onStart: (cols: number, rows: number) => void
  onClose: () => void
}

const PRESETS = [
  { n: 16, label: '小型 · 简单图案' },
  { n: 32, label: '标准 · 日常推荐' },
  { n: 48, label: '中型 · 细节丰富' },
  { n: 64, label: '大型 · 精细创作' },
  { n: 128, label: '超大 · 复杂作品' },
  { n: 200, label: '巨幅 · 多拼盘拼接' },
]

const clampInt = (v: string): number => {
  const n = Math.round(Number(v))
  return Number.isFinite(n) ? Math.max(8, Math.min(256, n)) : 0
}

/** 模块4：从空白图纸开始 → 尺寸选择弹窗 */
export default function SizeDialog({ onStart, onClose }: Props) {
  const [preset, setPreset] = useState<number | null>(32) // 选中的预设；自定义时为 null
  const [cw, setCw] = useState('')
  const [ch, setCh] = useState('')

  const customW = clampInt(cw)
  const customH = clampInt(ch)
  const customValid = cw !== '' && ch !== '' && customW >= 8 && customH >= 8
  const canStart = preset !== null || customValid

  const start = () => {
    if (preset !== null) onStart(preset, preset)
    else if (customValid) onStart(customW, customH)
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-ink/45 p-4 backdrop-blur-sm animate-pop-in" onClick={onClose}>
      <div className="w-full max-w-md rounded-3xl border-2 border-ink bg-paper-50 p-6 shadow-pop-lg" onClick={(e) => e.stopPropagation()}>
        <h2 className="mb-5 text-center font-display text-xl font-extrabold text-ink">选择图纸尺寸</h2>

        <div className="space-y-2">
          {PRESETS.map((p) => {
            const active = preset === p.n
            return (
              <button
                key={p.n}
                type="button"
                onClick={() => {
                  setPreset(p.n)
                  setCw('')
                  setCh('')
                }}
                className={`flex w-full items-center gap-3 rounded-xl border-2 px-4 py-2.5 text-left transition-all ${
                  active ? 'border-ink bg-coral-soft shadow-sticker-sm' : 'border-paper-300 bg-paper-50 hover:border-ink'
                }`}
              >
                <span className={`grid h-5 w-5 shrink-0 place-items-center rounded-full border-2 ${active ? 'border-ink' : 'border-paper-400'}`}>
                  {active && <span className="h-2.5 w-2.5 rounded-full bg-coral" />}
                </span>
                <span className="font-mono text-sm font-bold text-ink">
                  {p.n}×{p.n}
                </span>
                <span className="text-sm text-ink-soft">{p.label}</span>
              </button>
            )
          })}
        </div>

        {/* 自定义 */}
        <div
          className={`mt-3 flex items-center gap-2.5 rounded-xl border-2 px-4 py-2.5 transition-colors ${
            preset === null ? 'border-ink bg-coral-soft' : 'border-paper-300'
          }`}
        >
          <span
            className={`grid h-5 w-5 shrink-0 place-items-center rounded-full border-2 ${preset === null ? 'border-ink' : 'border-paper-400'}`}
          >
            {preset === null && <span className="h-2.5 w-2.5 rounded-full bg-coral" />}
          </span>
          <span className="text-sm text-ink-soft">自定义</span>
          <input
            type="number"
            min={8}
            max={256}
            placeholder="宽"
            value={cw}
            onFocus={() => setPreset(null)}
            onChange={(e) => {
              setPreset(null)
              setCw(e.target.value)
            }}
            className="w-16 rounded-lg border-2 border-ink bg-white px-2 py-1 text-center font-mono text-sm text-ink outline-none focus:shadow-pink"
          />
          <span className="text-ink-faint">×</span>
          <input
            type="number"
            min={8}
            max={256}
            placeholder="高"
            value={ch}
            onFocus={() => setPreset(null)}
            onChange={(e) => {
              setPreset(null)
              setCh(e.target.value)
            }}
            className="w-16 rounded-lg border-2 border-ink bg-white px-2 py-1 text-center font-mono text-sm text-ink outline-none focus:shadow-pink"
          />
          <span className="text-[11px] text-ink-faint">8–256</span>
        </div>

        <div className="mt-6 flex items-center justify-end gap-3">
          <button type="button" onClick={onClose} className="btn-ghost">
            取消
          </button>
          <button type="button" onClick={start} disabled={!canStart} className="btn-cta">
            开始创作
          </button>
        </div>
      </div>
    </div>
  )
}
