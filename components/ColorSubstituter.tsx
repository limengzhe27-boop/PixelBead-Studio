'use client'

import type { ColorEntry } from '../types'
import { resolveColor } from '../data/brands'
import { hexToRgb, perceptualDistSq } from '../utils/imageProcessor'

interface Props {
  fromHex: string
  palette: ColorEntry[]
  onReplace: (toHex: string) => void
  onClose: () => void
}

/** 色号替换（v1.2 功能 6）：在当前品牌色卡中展示感知距离最近的 5 色，选中后全图批量替换。 */
export default function ColorSubstituter({ fromHex, palette, onReplace, onClose }: Props) {
  const from = resolveColor(fromHex, palette)
  const { r, g, b } = hexToRgb(fromHex)
  const candidates = palette
    .filter((c) => c.hex.toUpperCase() !== fromHex.toUpperCase())
    .map((c) => {
      const rgb = hexToRgb(c.hex)
      return { c, d: perceptualDistSq(r, g, b, rgb.r, rgb.g, rgb.b) }
    })
    .sort((a, b) => a.d - b.d)
    .slice(0, 5)

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-ink/40 p-4 backdrop-blur-sm animate-pop-in" onClick={onClose}>
      <div className="w-full max-w-sm rounded-3xl border-2 border-ink bg-paper-50 p-5 shadow-pop-lg" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg font-extrabold text-ink">替换颜色</h2>
          <button onClick={onClose} className="grid h-7 w-7 place-items-center rounded-lg text-ink-faint hover:bg-paper-100">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="mb-4 flex items-center gap-3 rounded-xl border-2 border-ink bg-paper-100 p-2.5">
          <span className="h-9 w-9 shrink-0 rounded-full border-2 border-ink" style={{ backgroundColor: fromHex }} />
          <div>
            <div className="text-sm font-bold text-ink">
              <span className="font-mono">{from?.code ?? '—'}</span> {from?.name_cn ?? ''}
            </div>
            <div className="text-[11px] text-ink-faint">将全图此色批量替换为：</div>
          </div>
        </div>

        <div className="space-y-1.5">
          {candidates.map(({ c }, i) => (
            <button
              key={c.code}
              onClick={() => onReplace(c.hex)}
              className="flex w-full items-center gap-3 rounded-xl border-2 border-ink bg-paper-50 px-3 py-2 text-left transition-all hover:-translate-y-0.5 hover:shadow-sticker-sm"
            >
              <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-paper-200 font-mono text-[10px] text-ink-soft">{i + 1}</span>
              <span className="h-7 w-7 shrink-0 rounded-full border-2 border-ink" style={{ backgroundColor: c.hex }} />
              <span className="text-sm text-ink">
                <span className="font-mono font-bold">{c.code}</span> {c.name_cn}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
