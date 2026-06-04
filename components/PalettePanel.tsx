import type { ColorEntry } from '../types'
import { resolveColor } from '../data/brands'

interface Props {
  color: string
  setColor: (hex: string) => void
  palette: ColorEntry[]
}

/** 右侧色盘（PRD §4.3 / §F4）：渲染当前品牌色卡，禁自定义颜色以保证色号准确。 */
export default function PalettePanel({ color, setColor, palette }: Props) {
  const active = color.toUpperCase()
  const entry = resolveColor(color, palette)

  return (
    <div className="border-b border-slate-100 px-3.5 py-4">
      {/* 当前颜色信息 */}
      <div className="mb-3 flex items-center gap-3 rounded-xl bg-slate-50 p-2.5">
        <span
          className="h-10 w-10 shrink-0 rounded-full border-2 border-white shadow-peg ring-1 ring-slate-200"
          style={{ backgroundColor: color }}
        />
        <div className="min-w-0">
          <div className="flex items-baseline gap-1.5">
            <span className="font-mono text-sm font-medium text-slate-800">{entry?.code ?? '—'}</span>
            <span className="truncate text-sm text-slate-700">{entry?.name_cn ?? '自定义'}</span>
          </div>
          <span className="text-[11px] text-slate-600">{entry?.name_en ?? color}</span>
        </div>
      </div>

      {/* 色盘 */}
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-medium text-slate-700">色盘</span>
        <span className="font-mono text-[10px] text-slate-600">{palette.length} 色</span>
      </div>
      <div className="grid grid-cols-6 gap-1.5">
        {palette.map((c) => {
          const isActive = c.hex.toUpperCase() === active
          return (
            <button
              key={c.code}
              type="button"
              title={`${c.code} · ${c.name_cn}`}
              onClick={() => setColor(c.hex)}
              className={`relative aspect-square rounded-full transition-transform hover:scale-110 ${
                isActive ? 'ring-2 ring-ink ring-offset-1 ring-offset-slate-0' : 'ring-1 ring-black/10'
              }`}
              style={{ backgroundColor: c.hex }}
            >
              {isActive && (
                <span className="absolute inset-0 grid place-items-center">
                  <span className="h-1.5 w-1.5 rounded-full bg-white mix-blend-difference" />
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
