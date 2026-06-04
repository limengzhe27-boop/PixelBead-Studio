interface Props {
  open: boolean
  onClose: () => void
  onPDF: () => void
  onPNG: () => void
  exporting: 'pdf' | 'png' | null
  error: string | null
}

/** 导出选项弹窗（PRD §F6） */
export default function ExportModal({ open, onClose, onPDF, onPNG, exporting, error }: Props) {
  if (!open) return null
  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-ink/40 p-4 backdrop-blur-sm animate-pop-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-3xl border-2 border-ink bg-paper-50 p-6 shadow-pop-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="font-display text-xl font-semibold text-ink">导出图纸</h2>
          <button onClick={onClose} className="grid h-8 w-8 place-items-center rounded-lg text-ink-faint hover:bg-paper-100">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-3">
          {/* PDF */}
          <button
            onClick={onPDF}
            disabled={exporting !== null}
            className="group flex w-full items-center gap-4 rounded-2xl border-2 border-ink bg-coral-soft p-4 text-left transition-all hover:-translate-y-0.5 hover:shadow-sticker disabled:opacity-60"
          >
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl border-2 border-ink bg-coral text-white">
              {exporting === 'pdf' ? (
                <span className="h-5 w-5 rounded-full border-2 border-white/40 border-t-white animate-bead-spin" />
              ) : (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6" />
                </svg>
              )}
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium text-ink">PDF 图纸</span>
                <span className="rounded-bead bg-coral px-1.5 py-0.5 text-[10px] font-medium text-white">推荐</span>
              </div>
              <p className="mt-0.5 text-xs leading-relaxed text-ink-soft">
                含序号标注、颜色图例与用豆清单，可无限放大打印，对着一颗颗拼。
              </p>
            </div>
          </button>

          {/* PNG */}
          <button
            onClick={onPNG}
            disabled={exporting !== null}
            className="group flex w-full items-center gap-4 rounded-2xl border-2 border-ink bg-paper-50 p-4 text-left transition-all hover:-translate-y-0.5 hover:shadow-sticker disabled:opacity-60"
          >
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl border-2 border-ink bg-ink text-paper-50">
              {exporting === 'png' ? (
                <span className="h-5 w-5 rounded-full border-2 border-paper-50/40 border-t-paper-50 animate-bead-spin" />
              ) : (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <circle cx="9" cy="9" r="2" />
                  <path d="m21 15-5-5L5 21" />
                </svg>
              )}
            </span>
            <div>
              <span className="font-medium text-ink">PNG 图片</span>
              <p className="mt-0.5 text-xs leading-relaxed text-ink-soft">纯图纸高清图，适合分享到小红书 / 微信。</p>
            </div>
          </button>
        </div>

        {error && <p className="mt-4 text-center text-sm text-coral-dark">{error}</p>}
      </div>
    </div>
  )
}
