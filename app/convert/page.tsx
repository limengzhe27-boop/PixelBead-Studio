'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { useProject } from '@/context/ProjectContext'
import { ARTKAL_MIDI_PALETTE } from '@/data/artkal'
import {
  isGridEmpty,
  loadImage,
  processImageToGrid,
  recommendDimensions,
} from '@/utils/imageProcessor'
import PixelPreview from '@/components/PixelPreview'
import BrandMark from '@/components/BrandMark'
import { removeBg, type BgProgress } from '@/utils/bgRemoval'
import type { PixelGrid } from '@/types'

export default function ConvertPage() {
  const { state, dispatch } = useProject()
  const router = useRouter()

  const imgRef = useRef<HTMLImageElement | null>(null)
  const ratioRef = useRef(1)
  const seededRef = useRef(false)
  const bgCache = useRef<{ src: string; out: string } | null>(null)
  const [imgReady, setImgReady] = useState(false)
  const [imgVersion, setImgVersion] = useState(0)
  const [grid, setGrid] = useState<PixelGrid | null>(null)
  const [computing, setComputing] = useState(false)

  // 预处理开关：色彩增强默认开启（更鲜艳）；降噪 + 去背景默认关闭（按需手动开启）
  const [bgRemove, setBgRemove] = useState(false)
  const [denoise, setDenoise] = useState(false)
  const [enhance, setEnhance] = useState(true)
  const [processedSrc, setProcessedSrc] = useState<string | null>(null)
  const [bgBusy, setBgBusy] = useState(false)
  const [bgProgress, setBgProgress] = useState<BgProgress | null>(null)
  const [bgError, setBgError] = useState<string | null>(null)
  const [fromRecognize, setFromRecognize] = useState(false) // 来自「识别色号」→ 提示按实物微调格数
  const [previewMode, setPreviewMode] = useState<'pixel' | 'ironed'>('pixel') // 像素图纸 / 烫后效果

  const { cols, rows, colorCount, sourceImage } = state

  // 路由保护：无原图 → 回首页
  useEffect(() => {
    if (!sourceImage) router.replace('/')
  }, [sourceImage, router])

  // 功能1：根据「智能去背景」开关决定用于预览/转换的图片源（带缓存，避免来回切换重复抠图）
  useEffect(() => {
    if (!sourceImage) return
    let alive = true
    if (!bgRemove) {
      setProcessedSrc(sourceImage)
      setBgError(null)
      return
    }
    if (bgCache.current?.src === sourceImage) {
      setProcessedSrc(bgCache.current.out)
      return
    }
    setBgBusy(true)
    setBgError(null)
    setBgProgress(null)
    removeBg(sourceImage, (pr) => {
      if (alive) setBgProgress(pr)
    })
      .then((url) => {
        if (!alive) return
        bgCache.current = { src: sourceImage, out: url }
        setProcessedSrc(url)
        setBgBusy(false)
        setBgProgress(null)
      })
      .catch((err) => {
        if (!alive) return
        console.error('[removeBg] 失败：', err) // 暴露真实错误，便于排查
        setProcessedSrc(sourceImage) // 失败回退原图
        setBgError('去背景失败，已使用原图（可重试）')
        setBgBusy(false)
        setBgProgress(null)
      })
    return () => {
      alive = false
    }
  }, [sourceImage, bgRemove])

  // 加载（去背景后的）图片到 imgRef，供预览与转换；bump imgVersion 触发重算
  useEffect(() => {
    if (!processedSrc) return
    let alive = true
    loadImage(processedSrc).then((img) => {
      if (!alive) return
      imgRef.current = img
      ratioRef.current = img.naturalWidth / img.naturalHeight || 1
      if (!seededRef.current) {
        seededRef.current = true
        let preset = false
        try {
          preset = sessionStorage.getItem('pixelbead_preset_dims') === '1'
        } catch {
          /* ignore */
        }
        if (preset) {
          // 来自成品识别：保留识别预设的格数（不自动重算），并提示用户按实物微调
          try {
            sessionStorage.removeItem('pixelbead_preset_dims')
          } catch {
            /* ignore */
          }
          setFromRecognize(true)
        } else {
          const rec = recommendDimensions(img.naturalWidth, img.naturalHeight, 32)
          dispatch({ type: 'SET_DIMENSIONS', payload: rec })
        }
      }
      setImgReady(true)
      setImgVersion((v) => v + 1)
    })
    return () => {
      alive = false
    }
  }, [processedSrc, dispatch])

  // 参数 / 图片源 / 降噪开关变化 → 防抖重算右侧像素预览
  useEffect(() => {
    if (!imgReady || !imgRef.current) return
    setComputing(true)
    const t = setTimeout(() => {
      const g = processImageToGrid(imgRef.current!, cols, rows, colorCount, ARTKAL_MIDI_PALETTE, denoise, enhance)
      setGrid(g)
      setComputing(false)
    }, 300)
    return () => clearTimeout(t)
  }, [imgReady, imgVersion, cols, rows, colorCount, denoise, enhance])

  const empty = useMemo(() => (grid ? isGridEmpty(grid) : true), [grid])
  // 豆子数：null = 尚未算出（首次防抖转换前），信息卡据此显示「计算中」
  const beadCount = useMemo(
    () => (grid ? grid.reduce((s, r) => s + r.filter(Boolean).length, 0) : null),
    [grid],
  )

  // 「最长边」滑块：短边永远按原图比例自动算、两边都 ≤256，永不拉伸（修复竖图被压扁的 bug）
  const longestSide = Math.max(cols, rows)
  const setLongest = (v: number) => {
    const a = ratioRef.current || 1
    let c: number
    let r: number
    if (a >= 1) {
      c = v
      r = Math.round(v / a)
    } else {
      r = v
      c = Math.round(v * a)
    }
    c = Math.max(8, Math.min(256, c))
    r = Math.max(8, Math.min(256, r))
    dispatch({ type: 'SET_DIMENSIONS', payload: { cols: c, rows: r } })
  }

  // 信息卡：实物尺寸（Artkal Mini 单颗 2.6mm）/ 拼盘数（29×29）
  const widthCm = ((cols * 2.6) / 10).toFixed(1)
  const heightCm = ((rows * 2.6) / 10).toFixed(1)
  const boards = Math.ceil(cols / 29) * Math.ceil(rows / 29)

  const confirm = () => {
    if (!grid || empty) return
    dispatch({ type: 'COMMIT_GRID', payload: grid })
    router.push('/editor')
  }

  if (!sourceImage) return null

  return (
    <div className="flex h-screen flex-col bg-paper-100">
      <header className="flex shrink-0 items-center justify-between border-b-2 border-ink bg-paper-50 px-5 py-3">
        <button onClick={() => router.push('/')} className="flex items-center gap-1.5 text-sm text-ink-soft transition-colors hover:text-ink">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5m0 0 7 7m-7-7 7-7" />
          </svg>
          返回
        </button>
        <Stepper current={2} />
        <div className="hidden sm:block">
          <BrandMark compact />
        </div>
      </header>

      {fromRecognize && (
        <div className="shrink-0 border-b-2 border-ink bg-sun/40 px-4 py-2 text-center text-xs leading-snug text-ink">
          📷 来自成品识别：已按 AI 估算格数生成预览。请对照实物拖动下方「格数」滑块调到真实尺寸，确认后进入编辑修正颜色。
        </div>
      )}

      <main className="grid min-h-0 flex-1 grid-cols-1 gap-4 overflow-auto p-3 sm:p-5 md:grid-cols-2">
        {/* 左：原图预览 + 预处理开关 */}
        <div className="flex min-h-0 flex-col gap-3">
          <Panel
            label="原图"
            className="h-[200px] shrink-0 md:h-[300px] lg:h-auto lg:min-h-0 lg:flex-1"
            badge={imgReady ? `${imgRef.current?.naturalWidth}×${imgRef.current?.naturalHeight}px` : ''}
          >
            <div className="relative flex h-full w-full items-center justify-center">
              {(processedSrc || sourceImage) && (
                <img
                  src={bgRemove ? (processedSrc ?? sourceImage)! : sourceImage!}
                  alt="原图"
                  className="max-h-full max-w-full rounded-lg object-contain shadow-craft"
                />
              )}
              {bgBusy && (
                <div className="absolute inset-0 grid place-items-center rounded-lg bg-paper-100/80 backdrop-blur-sm">
                  <span className="flex flex-col items-center gap-2 rounded-bead bg-ink/85 px-4 py-3 text-sm text-paper-50">
                    <span className="flex items-center gap-2">
                      <span className="h-3.5 w-3.5 rounded-full border-2 border-paper-50/40 border-t-paper-50 animate-bead-spin" />
                      {bgProgress?.phase === 'download'
                        ? `下载抠图模型 ${bgProgress.percent}%`
                        : '正在抠图…'}
                    </span>
                    {bgProgress?.phase === 'download' && (
                      <span className="text-[11px] text-paper-50/70">首次使用需下载模型（约 67MB），之后会缓存</span>
                    )}
                  </span>
                </div>
              )}
            </div>
          </Panel>

          {/* 预处理开关（功能1/功能2，相互独立） */}
          <div className="card-soft shrink-0 space-y-2.5 px-4 py-3">
            <Toggle
              checked={bgRemove}
              onChange={setBgRemove}
              label="智能去背景"
              hint={
                bgBusy
                  ? bgProgress?.phase === 'download'
                    ? `下载模型 ${bgProgress.percent}%…`
                    : '正在抠图…'
                  : '可选 · 本地 AI 抠主体（首次需下载模型约 67MB）'
              }
              busy={bgBusy}
            />
            <Toggle checked={denoise} onChange={setDenoise} label="降噪（默认关闭）" hint="照片噪点多时可开启（中值滤波保边，不删细节），但可能轻微影响清晰度" />
            <Toggle checked={enhance} onChange={setEnhance} label="色彩增强" hint="提升对比与饱和，成品更鲜艳好看（照片偏灰时尤其有效）" />
            {bgError && <p className="text-xs text-coral-dark">{bgError}</p>}
          </div>

          {/* 尺寸信息卡（始终显示，随格数实时更新；豆子数/时间转换完成后显示） */}
          <div className="card-soft shrink-0 space-y-1 px-4 py-3">
            <div className="flex items-center gap-1.5 text-sm font-medium text-ink">
              <span>📐</span> 成品尺寸约 {widthCm} × {heightCm} cm
            </div>
            <div className="text-xs text-ink-soft">
              {cols} × {rows} 格 · 🧩 约 {boards} 块拼盘（29×29）
            </div>
            <div className="text-xs text-ink-soft">🔴 {beadCount === null ? '计算中…' : `约 ${beadCount} 颗豆子`}</div>
            <div className="text-xs text-ink-soft">
              ⏱ 预计制作 {beadCount === null ? '计算中…' : formatBuildTime(beadCount)}
              <span className="text-ink-faint">（参考值，因人而异）</span>
            </div>
          </div>

          {/* 大尺寸分级提醒（互斥） */}
          {longestSide >= 180 ? (
            <div className="shrink-0 rounded-xl border-2 border-ink bg-coral/25 px-4 py-2.5 text-xs leading-snug text-ink">
              ⚠️ 尺寸非常大，新手不建议从这个尺寸开始。制作可能需要数十小时，建议先用小尺寸试做，或确认你有足够的拼盘和豆子。
            </div>
          ) : longestSide >= 100 ? (
            <div className="shrink-0 rounded-xl border-2 border-ink bg-sun/40 px-4 py-2.5 text-xs leading-snug text-ink">
              ⚠️ 这是大型作品，需约 {boards} 块拼盘{beadCount !== null ? `、约 ${beadCount} 颗豆子` : ''}，制作耗时较长，请确认材料充足。
            </div>
          ) : null}
        </div>

        {/* 右：像素图纸 / 烫后效果 预览 */}
        <div className="flex min-h-0 flex-col gap-2">
          <div className="flex shrink-0 items-center justify-between gap-2">
            <div className="inline-flex rounded-xl border-2 border-ink bg-paper-200 p-1">
              <button
                type="button"
                onClick={() => setPreviewMode('pixel')}
                className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${previewMode === 'pixel' ? 'bg-ink text-paper-50' : 'text-ink-soft hover:text-ink'}`}
              >
                像素图纸
              </button>
              <button
                type="button"
                onClick={() => setPreviewMode('ironed')}
                className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${previewMode === 'ironed' ? 'bg-ink text-paper-50' : 'text-ink-soft hover:text-ink'}`}
              >
                烫后效果
              </button>
            </div>
            <span className="font-mono text-xs text-ink-soft">{cols}×{rows} · 约 {beadCount ?? '…'} 颗</span>
          </div>
          <Panel label="像素效果" className="h-[200px] shrink-0 md:h-[300px] lg:h-auto lg:min-h-0 lg:flex-1" accent>
            <PixelPreview pixels={grid} ironed={previewMode === 'ironed'} computing={computing} />
          </Panel>
          {previewMode === 'ironed' && (
            <p className="shrink-0 text-center text-[11px] text-ink-faint">烫后效果为模拟预览，实际成品因豆子品牌、熨烫程度略有差异</p>
          )}
        </div>
      </main>

      <footer className="sticky bottom-0 shrink-0 border-t-2 border-ink bg-paper-50 px-4 py-3 sm:px-5 sm:py-4">
        <div className="mx-auto max-w-4xl space-y-3">
          {/* 图案精细度（最长边格数）：短边按原图比例自动算，不再拉伸 */}
          <div>
            <div className="mb-1.5 flex items-center justify-between gap-3 text-sm">
              <span className="text-ink-soft">图案精细度（最长边格数）</span>
              <span className="font-mono text-ink">
                当前：宽 <b>{cols}</b> × 高 <b>{rows}</b> 格
              </span>
            </div>
            <input
              type="range"
              min={16}
              max={256}
              value={longestSide}
              onChange={(e) => setLongest(Number(e.target.value))}
              className="h-1.5 w-full cursor-pointer appearance-none rounded-bead bg-paper-300 accent-coral"
            />
          </div>

          {/* 颜色数量 + 确认 */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-6">
            <SliderRow label="颜色数量" value={colorCount} min={6} max={30} onChange={(v) => dispatch({ type: 'SET_COLOR_COUNT', payload: v })} suffix={`${colorCount} 色`} className="flex-1" />
            <button onClick={confirm} disabled={empty || computing} className="btn-cta min-h-[48px] w-full justify-center whitespace-nowrap sm:w-auto">
              确认，进入编辑
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14m0 0-7-7m7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
        {empty && !computing && (
          <p className="mx-auto mt-2 max-w-4xl text-center text-xs text-coral-dark">图片可能全为透明区域，请返回检查后重试。</p>
        )}
      </footer>
    </div>
  )
}

/** 预计制作时间：按 400（新手）~ 800（熟练）颗/小时估算 */
function formatBuildTime(beadCount: number): string {
  const minHr = beadCount / 800
  const maxHr = beadCount / 400
  if (maxHr < 1) {
    const minM = Math.max(5, Math.round((minHr * 60) / 5) * 5)
    const maxM = Math.max(minM + 5, Math.round((maxHr * 60) / 5) * 5)
    return `约 ${minM}–${maxM} 分钟`
  }
  const lo = Math.max(1, Math.round(minHr))
  const hi = Math.max(lo + 1, Math.round(maxHr))
  return `约 ${lo}–${hi} 小时`
}

function Panel({ label, badge, accent, className = '', children }: { label: string; badge?: string; accent?: boolean; className?: string; children: ReactNode }) {
  return (
    <section className={`flex min-h-0 flex-col rounded-2xl border-2 bg-paper-50 p-4 shadow-soft ${accent ? 'border-coral' : 'border-ink'} ${className}`}>
      <div className="mb-3 flex items-center justify-between">
        <span className="tag">{label}</span>
        {badge && <span className="font-mono text-xs text-ink-soft">{badge}</span>}
      </div>
      <div className="flex min-h-0 flex-1 items-center justify-center overflow-hidden rounded-xl bg-pegboard-fine bg-paper-100/50 p-3">
        {children}
      </div>
    </section>
  )
}

function Toggle({
  checked,
  onChange,
  label,
  hint,
  busy,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  label: string
  hint?: string
  busy?: boolean
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2.5">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="h-4 w-4 accent-coral" />
      <span className="flex-1 leading-tight">
        <span className="text-sm font-medium text-ink">{label}</span>
        {hint && <span className="ml-2 text-xs text-ink-faint">{hint}</span>}
      </span>
      {busy && <span className="h-3.5 w-3.5 rounded-full border-2 border-ink/30 border-t-ink animate-bead-spin" />}
    </label>
  )
}

function SliderRow({
  label,
  value,
  min,
  max,
  onChange,
  suffix,
  className = '',
}: {
  label: string
  value: number
  min: number
  max: number
  onChange: (v: number) => void
  suffix: string
  className?: string
}) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <span className="w-16 shrink-0 text-sm text-ink-soft">{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-1.5 flex-1 cursor-pointer appearance-none rounded-bead bg-paper-300 accent-coral"
      />
      <span className="w-14 shrink-0 text-right font-mono text-sm text-ink">{suffix}</span>
    </div>
  )
}

function Stepper({ current }: { current: number }) {
  const steps = ['上传', '设置', '编辑']
  return (
    <div className="flex items-center gap-2">
      {steps.map((s, i) => {
        const n = i + 1
        const done = n < current
        const active = n === current
        return (
          <div key={s} className="flex items-center gap-2">
            <span
              className={`flex h-6 w-6 items-center justify-center rounded-full border-2 border-ink text-xs font-bold transition-colors ${
                active ? 'bg-coral text-white' : done ? 'bg-teal text-white' : 'bg-paper-200 text-ink-faint'
              }`}
            >
              {done ? '✓' : n}
            </span>
            <span className={`text-sm ${active ? 'font-bold text-ink' : 'text-ink-faint'}`}>{s}</span>
            {i < steps.length - 1 && <span className="mx-1 h-0.5 w-5 bg-ink/30" />}
          </div>
        )
      })}
    </div>
  )
}
