import { useCallback, useRef, useState } from 'react'

const MAX_SIZE = 20 * 1024 * 1024 // 20MB
const ACCEPT = 'image/png,image/jpeg,image/gif,image/webp,image/svg+xml'

interface Props {
  onImage: (dataUrl: string) => void
}

/** 图片上传区（PRD §F1 / §11）：拖拽 + 点击，本地处理不上传服务器 */
export default function UploadZone({ onImage }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false) // 读取大图 + 跳转期间给即时反馈，避免“点了没反应”

  const handleFile = useCallback(
    (file: File | undefined) => {
      if (!file) return
      if (!file.type.startsWith('image/')) {
        setError('请上传图片格式文件（PNG / JPG / WebP 等）')
        return
      }
      if (file.size > MAX_SIZE) {
        setError('图片过大，请压缩至 20MB 以内后重试')
        return
      }
      setError(null)
      setLoading(true)
      const reader = new FileReader()
      reader.onload = () => onImage(reader.result as string) // 跳转后本组件卸载，无需复位 loading
      reader.onerror = () => {
        setError('读取文件失败，请重试')
        setLoading(false)
      }
      reader.readAsDataURL(file)
    },
    [onImage],
  )

  return (
    <div>
      <button
        type="button"
        disabled={loading}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          if (loading) return
          e.preventDefault()
          setDragging(true)
        }}
        onDragLeave={(e) => {
          e.preventDefault()
          setDragging(false)
        }}
        onDrop={(e) => {
          e.preventDefault()
          setDragging(false)
          if (!loading) handleFile(e.dataTransfer.files?.[0])
        }}
        className={`group relative flex w-full flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed px-6 py-14 text-center transition-all duration-200 ${
          dragging
            ? 'border-coral bg-coral-soft'
            : 'border-ink/45 bg-paper-50 hover:-translate-y-0.5 hover:border-ink'
        } disabled:cursor-wait`}
      >
        {loading ? (
          <>
            <span className="grid h-16 w-16 place-items-center rounded-2xl border-2 border-ink bg-sun shadow-sticker-sm">
              <span className="h-7 w-7 rounded-full border-[3px] border-ink/30 border-t-ink animate-bead-spin" />
            </span>
            <p className="text-[15px] font-medium text-ink">正在载入图片…</p>
          </>
        ) : (
          <>
            <span
              className={`grid h-16 w-16 place-items-center rounded-2xl border-2 border-ink bg-sun shadow-sticker-sm transition-transform duration-200 ${
                dragging ? 'scale-110 -rotate-3' : 'group-hover:scale-105 group-hover:-rotate-3'
              }`}
            >
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-ink" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 16V4m0 0L7 9m5-5 5 5" />
                <path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
              </svg>
            </span>
            <div className="space-y-1">
              <p className="text-[15px] font-medium text-ink">
                {dragging ? '松手即可上传' : '拖拽图片到这里，或点击选择'}
              </p>
              <p className="text-xs text-ink-faint">支持 PNG / JPG / GIF / WebP / SVG，最大 20MB · 全程本地处理</p>
            </div>
          </>
        )}
      </button>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />

      {error && (
        <p className="mt-3 flex items-center gap-1.5 text-sm text-coral-dark animate-pop-in">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 8v5M12 16h.01" />
          </svg>
          {error}
        </p>
      )}
    </div>
  )
}
