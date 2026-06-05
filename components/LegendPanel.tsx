import type { LegendItem } from '../types'

interface Props {
  legend: LegendItem[]
  onReplace?: (hex: string) => void
}

/** 图例 + 用豆统计（PRD §F5）。排版以「可直接打印使用」为标准。 */
export default function LegendPanel({ legend, onReplace }: Props) {
  const max = legend.length > 0 ? legend[0].count : 1

  return (
    <div className="flex min-h-0 flex-1 flex-col pt-1">
      {legend.length === 0 ? (
        <div className="px-3.5 py-8 text-center text-xs text-slate-600">画布为空，开始绘制后这里会显示用豆清单。</div>
      ) : (
        <div className="scroll-thin min-h-0 flex-1 overflow-y-auto px-2 pb-3">
          {legend.map((it) => (
            <div key={it.hex} className="flex items-center gap-2 rounded-lg px-1.5 py-1.5 hover:bg-slate-50">
              <span
                className="h-6 w-6 shrink-0 rounded-md ring-1 ring-black/10"
                style={{ backgroundColor: it.hex }}
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-1">
                  <span className="truncate text-xs text-slate-800">
                    <span className="font-mono font-semibold text-slate-800">{it.artkalCode}</span>
                    {it.name_cn ? <span className="text-slate-600"> {it.name_cn}</span> : null}
                  </span>
                  <span className="shrink-0 font-mono text-[11px] text-slate-700">×{it.count}</span>
                </div>
                <div className="mt-1 h-1 overflow-hidden rounded-full bg-slate-100">
                  <span
                    className="block h-full rounded-full bg-teal"
                    style={{ width: `${Math.max(4, (it.count / max) * 100)}%` }}
                  />
                </div>
              </div>
              {onReplace && (
                <button
                  onClick={() => onReplace(it.hex)}
                  title="替换为其它色号"
                  className="shrink-0 rounded-md p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-coral"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M16 3l4 4-4 4M20 7H9M8 21l-4-4 4-4M4 17h11" />
                  </svg>
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
