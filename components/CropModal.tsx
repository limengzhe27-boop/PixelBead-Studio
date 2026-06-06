'use client'

import { useCallback, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import type { ReactNode } from 'react'
import Cropper from 'react-easy-crop'
import type { Area } from 'react-easy-crop'
import 'react-easy-crop/react-easy-crop.css'
import { flipDataURL, getCroppedDataURL } from '@/utils/cropImage'

interface Props {
  src: string // 完整 dataURL
  title?: string
  hint?: string
  onConfirm: (croppedDataUrl: string) => void // 确认：返回裁剪后的完整 dataURL
  onSkip: () => void // 跳过：不裁剪，用原图
  onCancel: () => void // 关闭：放弃（重新选图）
}

/**
 * 触控友好的裁剪弹层（react-easy-crop，整块按需懒加载）。
 * 手指拖动移动裁剪、双指捏合缩放；支持旋转 90°、水平/垂直翻转、自由裁、可跳过。
 * 翻转用「预翻转图片」实现，保证预览与输出一致。
 */
export default function CropModal({ src, title = '裁剪图片', hint, onConfirm, onSkip, onCancel }: Props) {
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState(0)
  const [flipH, setFlipH] = useState(false)
  const [flipV, setFlipV] = useState(false)
  const [displaySrc, setDisplaySrc] = useState(src)
  const [area, setArea] = useState<Area | null>(null)
  const [busy, setBusy] = useState(false)

  // 翻转：预翻转图片再喂给 cropper（预览与输出一致；旋转交给 cropper 的 rotation）
  useEffect(() => {
    let alive = true
    flipDataURL(src, flipH, flipV)
      .then((d) => alive && setDisplaySrc(d))
      .catch(() => alive && setDisplaySrc(src))
    return () => {
      alive = false
    }
  }, [src, flipH, flipV])

  const onCropComplete = useCallback((_: Area, pixels: Area) => setArea(pixels), [])

  const confirm = async () => {
    if (!area) {
      onSkip()
      return
    }
    setBusy(true)
    try {
      onConfirm(await getCroppedDataURL(displaySrc, area, rotation))
    } catch {
      onConfirm(displaySrc) // 裁剪失败兜底：用当前显示图
    } finally {
      setBusy(false)
    }
  }

  const reset = () => {
    setRotation(0)
    setFlipH(false)
    setFlipV(false)
    setZoom(1)
    setCrop({ x: 0, y: 0 })
  }

  // 用 portal 挂到 body：避开首页卡片的 transform/filter 祖先（否则 fixed 会相对该祖先而非视口，弹层盖不满全屏）
  if (typeof document === 'undefined') return null
  return createPortal(
    <div className="fixed inset-0 z-[95] grid grid-rows-[auto_1fr_auto] bg-ink animate-pop-in" style={{ touchAction: 'none' }}>
      {/* 顶部 */}
      <div className="flex items-center justify-between px-4 py-3 text-paper-50">
        <span className="text-sm font-bold">{title}</span>
        <button onClick={onCancel} aria-label="关闭" className="grid h-9 w-9 place-items-center rounded-lg text-paper-50 hover:bg-white/10">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
        </button>
      </div>

      {/* 裁剪区（react-easy-crop 需要一个有尺寸的相对定位容器） */}
      <div className="relative bg-ink">
        <Cropper
          image={displaySrc}
          crop={crop}
          zoom={zoom}
          rotation={rotation}
          aspect={undefined}
          minZoom={1}
          maxZoom={5}
          restrictPosition={false}
          showGrid
          objectFit="contain"
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onRotationChange={setRotation}
          onCropComplete={onCropComplete}
        />
      </div>

      {/* 控件 + 按钮（底部留出 iPhone home 条安全区） */}
      <div className="space-y-3 border-t-2 border-ink bg-paper-50 px-4 py-3" style={{ paddingBottom: 'calc(12px + env(safe-area-inset-bottom))' }}>
        {hint && <p className="text-[11px] leading-snug text-ink-faint">{hint}</p>}

        <div className="flex items-center gap-3">
          <span className="shrink-0 text-xs text-ink-soft">缩放</span>
          <input
            type="range"
            min={1}
            max={5}
            step={0.01}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="h-2 flex-1 cursor-pointer appearance-none rounded-bead bg-paper-300 accent-coral"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <ToolBtn onClick={() => setRotation((r) => (r + 90) % 360)} label="旋转 90°">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 2v6h-6" /><path d="M3 12a9 9 0 0 1 15-6.7L21 8" /><path d="M3 22v-6h6" /><path d="M21 12a9 9 0 0 1-15 6.7L3 16" /></svg>
            旋转
          </ToolBtn>
          <ToolBtn onClick={() => setFlipH((v) => !v)} active={flipH} label="水平翻转">⇋ 水平</ToolBtn>
          <ToolBtn onClick={() => setFlipV((v) => !v)} active={flipV} label="垂直翻转">⇅ 垂直</ToolBtn>
          <ToolBtn onClick={reset} label="重置">重置</ToolBtn>
        </div>

        <div className="flex gap-2">
          <button onClick={onSkip} className="btn-ghost min-h-[44px] flex-1 justify-center py-2 text-sm">跳过裁剪</button>
          <button onClick={confirm} disabled={busy} className="btn-cta min-h-[44px] flex-[2] justify-center py-2 text-sm">
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
