'use client'

interface Props {
  onClose: () => void
}

/** 首次进入编辑器的轻量引导层（点击任意处或「知道了」关闭，状态由父组件写入 localStorage）。 */
export default function EditorGuide({ onClose }: Props) {
  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 cursor-pointer bg-ink/60 backdrop-blur-[1px] animate-pop-in"
      role="dialog"
      aria-label="编辑器使用引导"
    >
      {/* 左：选择工具（指向左侧工具栏） */}
      <div className="absolute left-[66px] top-[84px] flex items-center gap-2 text-white">
        <svg width="34" height="20" viewBox="0 0 34 20" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
          <path d="M33 10H4m0 0 7-7m-7 7 7 7" />
        </svg>
        <span className="rounded-bead border-2 border-white/85 bg-ink/50 px-3 py-1 text-sm font-bold">选择工具</span>
      </div>

      {/* 右：选择颜色（指向右侧色盘） */}
      <div className="absolute right-[260px] top-[84px] flex items-center gap-2 text-white">
        <span className="rounded-bead border-2 border-white/85 bg-ink/50 px-3 py-1 text-sm font-bold">选择颜色</span>
        <svg width="34" height="20" viewBox="0 0 34 20" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
          <path d="M1 10h29m0 0-7-7m7 7-7 7" />
        </svg>
      </div>

      {/* 中：主文字 + 知道了 */}
      <div className="absolute inset-0 grid place-items-center px-6">
        <div className="text-center">
          <p className="font-display text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
            点击格子开始编辑
          </p>
          <p className="mx-auto mt-2 max-w-[360px] text-sm leading-relaxed text-white/70">
            画笔涂色 · 橡皮清除 · 油漆桶填充 · 取色器吸色，随时撤销重做
          </p>
          <button
            onClick={onClose}
            className="mt-6 rounded-[14px] border-2 border-white bg-coral px-7 py-2.5 font-bold text-white shadow-[4px_4px_0_rgba(0,0,0,0.45)] transition-all hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[2px_2px_0_rgba(0,0,0,0.45)]"
          >
            知道了
          </button>
        </div>
      </div>
    </div>
  )
}
