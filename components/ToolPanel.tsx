import type { ColorEntry, ToolType } from '../types'
import { resolveColor } from '../data/brands'
import Tooltip from './Tooltip'

interface Props {
  tool: ToolType
  setTool: (t: ToolType) => void
  color: string
  palette: ColorEntry[]
  brushSize: number
  setBrushSize: (n: number) => void
}

const TOOLS: { tool: ToolType; label: string; key: string; tip: string; icon: JSX.Element }[] = [
  {
    tool: 'brush',
    label: '画笔',
    key: 'B',
    tip: '点击或拖拽给格子涂色',
    icon: <path d="M15.5 4.5l4 4L9 19l-4.5 1 1-4.5L15.5 4.5z M14 6l4 4" />,
  },
  {
    tool: 'eraser',
    label: '橡皮擦',
    key: 'E',
    tip: '清除格子，恢复透明',
    icon: <path d="M4 16.5L13 7.5a2 2 0 0 1 3 0l4 4a2 2 0 0 1 0 3L17 18H8l-4-4z M9 19h11" />,
  },
  {
    tool: 'bucket',
    label: '油漆桶',
    key: 'F',
    tip: '填充相邻同色区域',
    icon: <path d="M5 11l6-6 7 7-6 6a2 2 0 0 1-3 0l-4-4a2 2 0 0 1 0-3z M19 14s2 2.5 2 4a2 2 0 1 1-4 0c0-1.5 2-4 2-4z" />,
  },
  {
    tool: 'eyedropper',
    label: '取色器',
    key: 'I',
    tip: '点击格子吸取颜色',
    icon: <path d="M19 3a2.8 2.8 0 0 1 2 4.8l-8 8-4 1 1-4 8-8A2.8 2.8 0 0 1 19 3z M5 19l3-3" />,
  },
  {
    tool: 'magicEraser',
    label: '魔法橡皮',
    key: 'W',
    tip: '点击清除相连的同色区域',
    icon: (
      <>
        <path d="M5 19L15 9M13 7l4 4" />
        <path d="M18 3l.8 2.2L21 6l-2.2.8L18 9l-.8-2.2L15 6l2.2-.8L18 3z" />
      </>
    ),
  },
  {
    tool: 'hand',
    label: '手型',
    key: 'H',
    tip: '拖拽平移画布',
    icon: <path d="M18 11V6a1.5 1.5 0 0 0-3 0V5a1.5 1.5 0 0 0-3 0 1.5 1.5 0 0 0-3 0v1.5a1.5 1.5 0 0 0-3 0V14a7 7 0 0 0 7 7h1a6 6 0 0 0 6-6v-3a1.5 1.5 0 0 0-3 0" />,
  },
]

const SIZES = [1, 2, 3]

/** 左侧工具栏（PRD §4.3，宽 54px）+ 魔法橡皮 + 笔刷尺寸 */
export default function ToolPanel({ tool, setTool, color, palette, brushSize, setBrushSize }: Props) {
  const entry = resolveColor(color, palette)
  const showSize = tool === 'brush' || tool === 'eraser'

  return (
    <aside className="flex h-full w-[54px] shrink-0 flex-col items-center gap-1.5 overflow-y-auto border-r-2 border-ink bg-slate-0 py-3 scroll-thin">
      {TOOLS.map((t) => {
        const active = tool === t.tool
        return (
          <Tooltip key={t.tool} title={t.label} shortcut={t.key} desc={t.tip}>
            <button
              type="button"
              aria-label={`${t.label} (${t.key})`}
              onClick={() => setTool(t.tool)}
              className={`group relative grid h-10 w-10 place-items-center rounded-xl transition-all ${
                active ? 'bg-ink text-paper-50 shadow-craft' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                {t.icon}
              </svg>
            </button>
          </Tooltip>
        )
      })}

      {/* 笔刷尺寸（选中画笔/橡皮时显示，功能3） */}
      {showSize && (
        <>
          <div className="my-0.5 h-px w-7 bg-slate-100" />
          <span className="text-[9px] leading-none text-slate-500">笔刷</span>
          {SIZES.map((s) => (
            <button
              key={s}
              type="button"
              title={`${s}×${s}`}
              onClick={() => setBrushSize(s)}
              className={`grid h-6 w-10 place-items-center rounded-md font-mono text-[10px] transition-all ${
                brushSize === s ? 'bg-coral text-white' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              {s}×{s}
            </button>
          ))}
        </>
      )}

      <div className="my-1 h-px w-7 bg-slate-100" />

      {/* 当前颜色指示 */}
      <div className="flex flex-col items-center gap-1" title={entry ? `${entry.code} ${entry.name_cn}` : color}>
        <span
          className="h-8 w-8 rounded-full border-2 border-white shadow-peg ring-1 ring-slate-200"
          style={{ backgroundColor: color }}
        />
        <span className="font-mono text-[10px] leading-none text-slate-600">{entry?.code ?? '—'}</span>
      </div>
    </aside>
  )
}
