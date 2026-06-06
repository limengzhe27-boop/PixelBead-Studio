'use client'

import { useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import { useProject } from '@/context/ProjectContext'
import { compressDataURLToBase64, fileToDataURL } from '@/utils/imageCompressor'
import { loadImage, recommendDimensions } from '@/utils/imageProcessor'
import { hasProvider, headersFor } from '@/utils/providerConfig'
import { useSettings } from '@/context/SettingsContext'

const CropModal = dynamic(() => import('@/components/CropModal'), { ssr: false }) // 按需懒加载

const MAX_SIZE = 20 * 1024 * 1024

/**
 * 成品照片识别（v2 重构）：上传拼豆成品俯拍照 → Qwen-VL 还原为完整像素图纸 → 直接进编辑器修正。
 * （旧版只输出采购色号清单，已废弃。）
 */
export default function ColorRecognizer() {
  const router = useRouter()
  const { dispatch } = useProject()
  const { openSettings } = useSettings()
  const inputRef = useRef<HTMLInputElement>(null)
  const [pendingCrop, setPendingCrop] = useState<string | null>(null) // 待裁剪图 dataURL（非空即弹裁剪框）
  const [src, setSrc] = useState('') // 裁剪/跳过后用于识别 + 进编辑器的完整 dataURL
  const [preview, setPreview] = useState('')
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')
  const [goSettings, setGoSettings] = useState(false)

  const resetInput = () => {
    if (inputRef.current) inputRef.current.value = ''
  }

  const pick = async (f?: File) => {
    if (!f) return
    if (!f.type.startsWith('image/')) return setError('请上传图片格式文件')
    if (f.size > MAX_SIZE) return setError('图片过大，请压缩至 20MB 以内')
    setError('')
    try {
      setPendingCrop(await fileToDataURL(f)) // 先弹裁剪框（可跳过），裁好/跳过后再识别
    } catch {
      setError('读取图片失败，请重试')
    }
  }

  const recognize = async () => {
    if (!src || loading) return
    setGoSettings(false)
    if (!hasProvider('vision')) {
      setError('成品转图纸需要配置「视觉模型」（推荐阿里云百炼 Qwen-VL，有免费额度）')
      setGoSettings(true)
      return
    }
    setLoading(true)
    setError('')
    try {
      setStatus('正在处理图片…')
      const original = src // 裁剪后的完整 dataURL
      const compressed = await compressDataURLToBase64(original, 800)
      const img = await loadImage(original)

      // 视觉模型估算作品格数（它能胜任的轻任务；失败则用默认目标边长 48 兜底）
      setStatus('AI 正在估算作品格数…')
      let target = 48
      try {
        const res = await fetch('/api/recognize-colors', {
          method: 'POST',
          headers: headersFor('vision'),
          body: JSON.stringify({ imageBase64: compressed }),
        })
        const d = await res.json()
        if (res.ok && d?.rows && d?.cols) target = Math.max(8, Math.min(128, Math.max(d.rows, d.cols)))
      } catch {
        /* 估算失败 → 用默认 target=48 */
      }

      // 按图片长宽比 + AI 估算边长定出起始网格；真正的逐格取色在 /convert 用成熟管线完成，
      // 并让用户对照实物拖动「格数」微调到真实尺寸（编辑器无改尺寸功能，故放在转换页确认）
      const dims = recommendDimensions(img.naturalWidth, img.naturalHeight, target, 128) // 成品识别上限保持 128
      dispatch({ type: 'SET_SOURCE_IMAGE', payload: original }) // 完整 dataURL
      dispatch({ type: 'SET_DIMENSIONS', payload: { cols: dims.cols, rows: dims.rows } })
      try {
        sessionStorage.setItem('pixelbead_preset_dims', '1') // 转换页据此跳过自动重算尺寸、并提示按实物微调
        sessionStorage.setItem('pixelbead_from_recognize', '1') // 编辑器显示一次性「结果仅供参考」提示
      } catch {
        /* ignore */
      }
      router.push('/convert') // 与上传 / AI 主流程一致：转换页确认格数与颜色 → 编辑器
    } catch (e) {
      console.error(e)
      setError('图片处理失败，请换一张重试')
    } finally {
      setLoading(false)
      setStatus('')
    }
  }

  return (
    <div className="space-y-4">
      {/* 拍摄建议 */}
      <div className="rounded-xl border border-paper-300 bg-paper-100 px-3.5 py-3">
        <p className="mb-1.5 text-xs font-bold text-ink">📸 拍摄建议，提高识别准确率</p>
        <ul className="space-y-1 text-[11px] leading-relaxed text-ink-soft">
          <li>✓ 从正上方垂直俯拍，避免斜角</li>
          <li>✓ 光线均匀，避免强光直射反光</li>
          <li>✓ 拼豆充满画面，减少多余背景</li>
          <li>✓ 建议 48×48 格以内的作品，识别更准</li>
        </ul>
      </div>

      {/* 上传区 / 预览 */}
      {!preview ? (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault()
            pick(e.dataTransfer.files?.[0])
          }}
          className="flex min-h-[44px] w-full flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-ink/45 bg-paper-50 px-6 py-10 text-center transition-all hover:-translate-y-0.5 hover:border-ink"
        >
          <span className="grid h-14 w-14 place-items-center rounded-2xl border-2 border-ink bg-teal shadow-sticker-sm">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
              <circle cx="12" cy="13" r="3.5" />
            </svg>
          </span>
          <span className="text-[15px] font-bold text-ink">点击上传或拖拽成品照片</span>
          <span className="text-xs text-ink-soft">AI 还原为可编辑的像素图纸，进入编辑器后可修正</span>
        </button>
      ) : (
        <div className="flex items-center gap-3">
          <img src={preview} alt="成品预览" className="h-24 w-24 shrink-0 rounded-xl border-2 border-ink object-cover" />
          <div className="flex flex-1 flex-col gap-2">
            <button onClick={recognize} disabled={loading} className="btn-cta min-h-[44px] justify-center py-2 text-sm">
              {loading ? (
                <>
                  <span className="h-4 w-4 rounded-full border-2 border-white/40 border-t-white animate-bead-spin" />
                  识别中…
                </>
              ) : (
                '开始识别 → 转换设置'
              )}
            </button>
            {!loading && (
              <button onClick={() => inputRef.current?.click()} className="text-xs text-ink-faint hover:text-ink">
                换一张
              </button>
            )}
          </div>
        </div>
      )}
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={(e) => pick(e.target.files?.[0])} />

      {pendingCrop && (
        <CropModal
          src={pendingCrop}
          title="裁剪成品照片"
          hint="裁掉桌面 / 背景、只留拼豆作品，能明显提升识别准确度；也可「跳过裁剪」。"
          onConfirm={(cropped) => {
            setSrc(cropped)
            setPreview(cropped)
            setPendingCrop(null)
          }}
          onSkip={() => {
            setSrc(pendingCrop)
            setPreview(pendingCrop)
            setPendingCrop(null)
          }}
          onCancel={() => {
            setPendingCrop(null)
            resetInput()
          }}
        />
      )}

      {loading && (
        <div className="rounded-xl bg-paper-100 px-3.5 py-2.5 text-center">
          <p className="text-sm font-medium text-ink">{status}</p>
          <p className="mt-0.5 text-[11px] text-ink-faint">识别大型图案可能较慢，请耐心等待</p>
        </div>
      )}

      {error && (
        <div className="space-y-2">
          <p className="flex items-start gap-1.5 text-sm text-coral-dark">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="mt-0.5 shrink-0"><circle cx="12" cy="12" r="10" /><path d="M12 8v5M12 16h.01" /></svg>
            {error}
          </p>
          {goSettings && (
            <button type="button" onClick={openSettings} className="btn-ghost min-h-[44px] w-full justify-center py-2 text-sm">
              ⚙️ 去设置
            </button>
          )}
        </div>
      )}

      <p className="text-[11px] text-ink-faint">AI 估算格数后进入转换页，可对照实物微调到真实尺寸，再进入编辑器修正颜色。</p>
    </div>
  )
}
