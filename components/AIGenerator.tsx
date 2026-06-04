'use client'

import { useEffect, useRef, useState } from 'react'
import { compressToBase64 } from '@/utils/imageCompressor'
import { hasProvider, headersFor } from '@/utils/providerConfig'
import { useSettings } from '@/context/SettingsContext'

interface Props {
  /** 「用这张图」后回调，传出完整图片 dataURL（进入 /convert 主流程） */
  onImage: (dataUrl: string) => void
}

const EXAMPLES = ['可爱橘猫', '皮卡丘正面', '小猪佩奇', '马里奥蘑菇', '红色的爱心', '樱花树']
const MAX_REF = 3

type Stage = 'idle' | 'analyzing' | 'enhancing' | 'generating' | 'preparing'

/**
 * AI 生图（v1.2 功能 10 + 参考图）：可选上传 1–3 张参考图 → Qwen-VL 理解内容 → 与文字合并
 * → DeepSeek 扩写 → 硅基流动生图（FLUX.1，未开通自动回退 Kolors，返回 URL）→ 预览 →
 * 经同源 /api/proxy-image 下载为 dataURL → /convert。Key 全在服务端。
 */
export default function AIGenerator({ onImage }: Props) {
  const { openSettings } = useSettings()
  const [text, setText] = useState('')
  const [refImages, setRefImages] = useState<File[]>([])
  const [refPreviews, setRefPreviews] = useState<string[]>([])
  const [stage, setStage] = useState<Stage>('idle')
  const [error, setError] = useState<string | null>(null)
  const [goSettings, setGoSettings] = useState(false) // 缺配置 → 显示「去设置」
  const [result, setResult] = useState<string | null>(null) // 生成图 URL
  const refInput = useRef<HTMLInputElement>(null)
  const loading = stage !== 'idle'

  // 卸载时释放参考图的 Object URL
  useEffect(
    () => () => {
      refPreviews.forEach((u) => URL.revokeObjectURL(u))
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )

  const addRefs = (files: FileList | null) => {
    if (!files) return
    const imgs = Array.from(files).filter((f) => f.type.startsWith('image/'))
    const toAdd = imgs.slice(0, MAX_REF - refImages.length)
    if (toAdd.length === 0) return
    setRefImages((prev) => [...prev, ...toAdd])
    setRefPreviews((prev) => [...prev, ...toAdd.map((f) => URL.createObjectURL(f))])
  }
  const removeRef = (i: number) => {
    URL.revokeObjectURL(refPreviews[i])
    setRefImages((prev) => prev.filter((_, j) => j !== i))
    setRefPreviews((prev) => prev.filter((_, j) => j !== i))
  }

  const generate = async () => {
    if (!text.trim() || loading) return
    setError(null)
    setGoSettings(false)
    // 缺配置拦截（BYOK）：图像生成必需；用参考图则视觉模型必需；文本模型可选
    if (!hasProvider('image')) {
      setError('AI 生成图片需要配置「图像生成模型」（推荐硅基流动 Kolors，有免费额度）')
      setGoSettings(true)
      return
    }
    if (refImages.length > 0 && !hasProvider('vision')) {
      setError('使用参考图片需要配置「视觉模型」（推荐阿里云百炼 Qwen-VL，有免费额度）')
      setGoSettings(true)
      return
    }
    setResult(null)
    try {
      let desc = text.trim()

      // 1) 有参考图 → 视觉模型分析后并入描述（失败静默降级）
      if (refImages.length > 0) {
        setStage('analyzing')
        try {
          const imgs = await Promise.all(refImages.map((f) => compressToBase64(f, 600)))
          const r = await fetch('/api/analyze-images', {
            method: 'POST',
            headers: headersFor('vision'),
            body: JSON.stringify({ images: imgs }),
          })
          const d = await r.json()
          if (r.ok && d?.description) desc = `${d.description}；${text.trim()}`
        } catch {
          /* 分析失败 → 用原始文字 */
        }
      }

      // 2) 提示词优化（可选：配了文本模型才做，失败降级用原描述）
      let finalPrompt = desc
      if (hasProvider('chat')) {
        setStage('enhancing')
        try {
          const r = await fetch('/api/enhance-prompt', {
            method: 'POST',
            headers: headersFor('chat'),
            body: JSON.stringify({ prompt: desc }),
          })
          const d = await r.json()
          if (r.ok && (d?.enhancedPrompt || d?.prompt)) finalPrompt = d.enhancedPrompt || d.prompt
        } catch {
          /* 沿用 desc */
        }
      }

      // 3) 生图（返回 URL 或 data: base64）
      setStage('generating')
      const r = await fetch('/api/generate-image', {
        method: 'POST',
        headers: headersFor('image'),
        body: JSON.stringify({ prompt: finalPrompt }),
      })
      const d = await r.json()
      if (!r.ok || !d?.imageUrl) throw new Error(d?.error || '生图失败，请重试')
      setResult(d.imageUrl)
    } catch (e) {
      setError(e instanceof Error ? e.message : '生图失败，请重试')
    } finally {
      setStage('idle')
    }
  }

  // 用生成图进入像素转换：data: 直接用，外链经同源代理下载（规避 CORS / canvas 污染）
  const useImage = async () => {
    if (!result || loading) return
    setStage('preparing')
    setError(null)
    try {
      const fetchUrl = result.startsWith('data:') ? result : `/api/proxy-image?url=${encodeURIComponent(result)}`
      const res = await fetch(fetchUrl)
      if (!res.ok) throw new Error('图片下载失败，请重试')
      const blob = await res.blob()
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const fr = new FileReader()
        fr.onload = () => resolve(fr.result as string)
        fr.onerror = () => reject(new Error('图片读取失败'))
        fr.readAsDataURL(blob)
      })
      onImage(dataUrl) // 完整 dataURL → 主流程 /convert
    } catch (e) {
      setError(e instanceof Error ? e.message : '图片处理失败，请重试')
      setStage('idle')
    }
  }

  const stageText =
    stage === 'analyzing'
      ? '正在分析参考图片…'
      : stage === 'enhancing'
        ? '正在理解描述…'
        : stage === 'generating'
          ? '正在生成图片…（约 15–30 秒）'
          : stage === 'preparing'
            ? '正在准备图片…'
            : ''

  // ===== 生成结果预览 =====
  if (result) {
    // 预览也走同源代理：强制 image/png、规避跨域图片有时无法直接 <img> 显示
    const proxied = `/api/proxy-image?url=${encodeURIComponent(result)}`
    return (
      <div className="space-y-4">
        <div className="overflow-hidden rounded-2xl border-2 border-ink bg-paper-100 shadow-sticker">
          <img src={proxied} alt="AI 生成结果" className="mx-auto block max-h-[320px] w-full object-contain" />
        </div>
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-[auto_1fr]">
          <button type="button" onClick={() => { setResult(null); setError(null) }} disabled={loading} className="btn-ghost min-h-[48px] justify-center">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-3-6.7M21 4v4h-4" /></svg>
            重新生成
          </button>
          <button type="button" onClick={useImage} disabled={loading} className="btn-cta min-h-[48px] justify-center">
            {stage === 'preparing' ? (
              <>
                <span className="h-4 w-4 rounded-full border-2 border-white/40 border-t-white animate-bead-spin" />
                正在准备…
              </>
            ) : (
              <>
                用这张图生成像素图纸
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14m0 0-7-7m7 7-7 7" /></svg>
              </>
            )}
          </button>
        </div>
        {error && (
          <p className="flex items-center gap-1.5 text-sm text-coral-dark animate-pop-in">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10" /><path d="M12 8v5M12 16h.01" /></svg>
            {error}
          </p>
        )}
        <p className="text-center text-[11px] text-ink-faint">不满意可「重新生成」；满意则进入下一步设置格数与颜色数量。</p>
      </div>
    )
  }

  // ===== 输入态 =====
  return (
    <div className="space-y-5">
      {/* 示例标签：手机横向滚动 */}
      <div className="scroll-thin -mx-1 flex flex-nowrap gap-2 overflow-x-auto px-1 sm:flex-wrap sm:overflow-x-visible">
        {EXAMPLES.map((ex) => (
          <button
            key={ex}
            type="button"
            onClick={() => setText(ex)}
            disabled={loading}
            className="shrink-0 rounded-bead border-[1.5px] border-ink bg-paper-50 px-3 py-1.5 text-xs font-bold text-ink transition-all hover:-translate-y-0.5 hover:bg-sun disabled:opacity-50"
          >
            {ex}
          </button>
        ))}
      </div>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') generate()
        }}
        rows={3}
        disabled={loading}
        placeholder="用中文描述你想拼的图案，例如「一只戴帽子的柴犬」"
        className="w-full resize-none rounded-xl border-2 border-ink bg-paper-50 px-4 py-3 text-[15px] text-ink outline-none transition-shadow placeholder:text-ink-faint focus:shadow-pink disabled:opacity-60"
      />

      {/* 参考图片（可选，最多 3 张） */}
      <div className="space-y-2">
        <div className="flex items-baseline justify-between">
          <span className="text-xs font-bold text-ink">参考图片<span className="ml-1 font-normal text-ink-faint">可选 · 最多 {MAX_REF} 张</span></span>
          <span className="text-[11px] text-ink-faint">{refImages.length}/{MAX_REF}</span>
        </div>
        <p className="text-[11px] leading-snug text-ink-faint">上传角色/风格参考图，AI 会理解其内容并融入生成结果，更贴近你的想法。</p>
        <div className="flex flex-wrap gap-2">
          {refPreviews.map((url, i) => (
            <div key={i} className="relative h-16 w-16">
              <img src={url} alt={`参考图 ${i + 1}`} className="h-16 w-16 rounded-xl border-2 border-ink object-cover" />
              <button
                type="button"
                onClick={() => removeRef(i)}
                disabled={loading}
                aria-label="移除"
                className="absolute -right-2 -top-2 grid h-5 w-5 place-items-center rounded-full border-2 border-ink bg-coral text-[10px] font-bold text-white shadow-sticker-sm"
              >
                ✕
              </button>
            </div>
          ))}
          {refImages.length < MAX_REF && (
            <button
              type="button"
              onClick={() => refInput.current?.click()}
              disabled={loading}
              className="grid h-16 w-16 place-items-center rounded-xl border-2 border-dashed border-ink/45 text-2xl text-ink-faint transition-all hover:-translate-y-0.5 hover:border-ink hover:text-ink disabled:opacity-50"
            >
              +
            </button>
          )}
        </div>
        <input ref={refInput} type="file" accept="image/*" multiple className="hidden" onChange={(e) => addRefs(e.target.files)} />
      </div>

      <button type="button" onClick={generate} disabled={!text.trim() || loading} className="btn-cta min-h-[48px] w-full">
        {loading ? (
          <>
            <span className="h-4 w-4 rounded-full border-2 border-white/40 border-t-white animate-bead-spin" />
            {stageText || '生成中…'}
          </>
        ) : (
          <>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 3v3m0 12v3M5.6 5.6l2.1 2.1m8.6 8.6 2.1 2.1M3 12h3m12 0h3M5.6 18.4l2.1-2.1m8.6-8.6 2.1-2.1" />
            </svg>
            生成图片 → 转像素
          </>
        )}
      </button>

      <p className="text-[11px] text-ink-faint">
        参考图理解 → 提示词优化 → 生图 → 预览后进入转换页设置格数。需在 ⚙️ 设置中配置 AI 服务（支持任何 OpenAI 兼容厂商）。
      </p>

      {error && (
        <div className="space-y-2 animate-pop-in">
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
    </div>
  )
}
