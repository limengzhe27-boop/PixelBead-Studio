'use client'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type { ReactNode } from 'react'
import ReactCrop, { type Crop } from 'react-image-crop'
import 'react-image-crop/dist/ReactCrop.css'
import { bakeUpright, cropToDataURL } from '@/utils/cropImage'

interface Props {
  src: string // 完整 dataURL
  title?: string
  hint?: string
  onConfirm: (croppedDataUrl: string) => void // 确认：返回裁剪后的完整 dataURL
  onSkip: () => void // 跳过：不裁剪，用原图（或已旋转/翻转后的整图）
  onCancel: () => void // 关闭：放弃（重新选图）
}

const FULL: Crop = { unit: '%', x: 0, y: 0, width: 100, height: 100 }

/**
 * 触控友好的裁剪弹层（react-image-crop，整块按需懒加载）。
 * 交互：照片固定不缩放/不平移；裁剪框初始覆盖整张照片（= 不裁剪），拖角/边缩小、拖框内移动；
 * 框内保留、框外裁掉；自由比例；可旋转 90° / 水平翻转 / 垂直翻转（作用于照片，先烘焙成新图再裁）；
 * 「重置」恢复整图；可跳过。EXIF 方向已在 bakeUpright 内校正，手机照片正立显示。
 */
export default function CropModal({ src, title = '裁剪图片', hint, onConfirm, onSkip, onCancel }: Props) {
  const [rotation, setRotation] = useState(0)
  const [flipH, setFlipH] = useState(false)
  const [flipV, setFlipV] = useState(false)
  const [displaySrc, setDisplaySrc] = useState<string | null>(null)
  const [crop, setCrop] = useState<Crop>(FULL)
  const [busy, setBusy] = useState(false)

  // 测量裁剪区可用尺寸 → 以「像素」约束 .ReactCrop 的 max-width/height（库的 max-height:inherit
  // 链传的是百分比，对 auto 高度父级无效，必须给确切像素，整张图才会缩放装进按钮上方一屏）
  const areaRef = useRef<HTMLDivElement>(null)
  const [area, setArea] = useState({ w: 0, h: 0 })
  useEffect(() => {
    const el = areaRef.current
    if (!el) return
    const update = () => setArea({ w: el.clientWidth, h: el.clientHeight })
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    window.addEventListener('resize', update)
    return () => {
      ro.disconnect()
      window.removeEventListener('resize', update)
    }
  }, [])

  // 烘焙 EXIF 正立 + 旋转 + 翻转 → 当前显示图；每次变换后裁剪框恢复整图
  useEffect(() => {
    let alive = true
    bakeUpright(src, rotation, flipH, flipV)
      .then((d) => {
        if (!alive) return
        setDisplaySrc(d)
        setCrop(FULL)
      })
      .catch(() => {
        if (alive) setDisplaySrc(src)
      })
    return () => {
      alive = false
    }
  }, [src, rotation, flipH, flipV])

  const confirm = async () => {
    if (!displaySrc) return
    setBusy(true)
    try {
      // 框≈整图 / 无效 → 等价于不裁，直接用当前显示图（含旋转/翻转）
      const full = crop.width >= 99.5 && crop.height >= 99.5 && crop.x <= 0.5 && crop.y <= 0.5
      const out = full || crop.width <= 0 || crop.height <= 0 ? displaySrc : await cropToDataURL(displaySrc, crop)
      onConfirm(out)
    } catch {
      onConfirm(displaySrc)
    } finally {
      setBusy(false)
    }
  }

  const reset = () => {
    setRotation(0)
    setFlipH(false)
    setFlipV(false)
    setCrop(FULL)
  }

  if (typeof document === 'undefined') return null
  return createPortal(
    // ★ 用 100dvh（动态视口高度）+ flex 纵向：上图下钮，整张图缩放装进按钮上方一屏看全，不靠滚动
    <div className="fixed inset-x-0 top-0 z-[95] flex h-[100dvh] flex-col bg-ink animate-pop-in" style={{ touchAction: 'none' }}>
      {/* 顶部（紧凑） */}
      <div className="flex shrink-0 items-center justify-between px-4 py-2 text-paper-50">
        <span className="text-sm font-bold">{title}</span>
        <button onClick={onCancel} aria-label="关闭" className="grid h-9 w-9 place-items-center rounded-lg text-paper-50 hover:bg-white/10">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
        </button>
      </div>

      {/* 裁剪区：占满剩余空间，整张图缩放装进去（min-h-0 让 flex 子项能收缩，关键） */}
      <div ref={areaRef} className="grid min-h-0 flex-1 place-items-center overflow-hidden bg-ink">
        {displaySrc && area.h > 0 ? (
          <ReactCrop
            crop={crop}
            onChange={(_, percent) => setCrop(percent)}
            minWidth={28}
            minHeight={28}
            keepSelection
            ruleOfThirds
            // 用确切像素约束：库 CSS 的 max-height:inherit 会把这个像素值传到内部 <img>，整张图随之缩放装进可视区。
            // 再各留 ~20px 余量：裁剪手柄会从框边缘外探出半个身位（手机手柄 30px），避免下/上边手柄探到按钮或标题后面。
            style={{ maxHeight: area.h - 40, maxWidth: area.w - 40 }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={displaySrc} alt="裁剪预览" draggable={false} className="block select-none" />
          </ReactCrop>
        ) : (
          <span className="text-sm text-paper-50/70">载入中…</span>
        )}
      </div>

      {/* 控件 + 按钮：图片下方正常流，不浮在图上；紧凑；底部留 iPhone home 条安全区 */}
      <div className="shrink-0 space-y-2 border-t-2 border-ink bg-paper-50 px-4 pt-2.5" style={{ paddingBottom: 'calc(10px + env(safe-area-inset-bottom))' }}>
        {hint && <p className="text-[11px] leading-snug text-ink-faint">{hint}</p>}

        <div className="flex flex-wrap items-center gap-2">
          <ToolBtn onClick={() => setRotation((r) => (r + 90) % 360)} label="旋转 90°">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 2v6h-6" /><path d="M3 12a9 9 0 0 1 15-6.7L21 8" /><path d="M3 22v-6h6" /><path d="M21 12a9 9 0 0 1-15 6.7L3 16" /></svg>
            旋转
          </ToolBtn>
          <ToolBtn onClick={() => setFlipH((v) => !v)} active={flipH} label="水平翻转">⇋ 水平</ToolBtn>
          <ToolBtn onClick={() => setFlipV((v) => !v)} active={flipV} label="垂直翻转">⇅ 垂直</ToolBtn>
          <ToolBtn onClick={reset} label="重置为整图">重置</ToolBtn>
        </div>

        <div className="flex gap-2">
          <button onClick={onSkip} className="btn-ghost min-h-[44px] flex-1 justify-center py-2 text-sm">跳过裁剪</button>
          <button onClick={confirm} disabled={busy || !displaySrc} className="btn-cta min-h-[44px] flex-[2] justify-center py-2 text-sm">
            {busy ? '裁剪中…' : '确认裁剪'}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}

function ToolBtn({ onClick, active, label, children }: { onClick: () => void; active?: boolean; label: string; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      className={`flex min-h-[40px] items-center gap-1 rounded-lg border-2 px-3 py-1.5 text-xs font-medium transition-colors ${
        active ? 'border-coral bg-coral-soft text-coral-dark' : 'border-ink/20 bg-paper-100 text-ink hover:border-ink'
      }`}
    >
      {children}
    </button>
  )
}
