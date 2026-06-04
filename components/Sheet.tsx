'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

interface Props {
  open: boolean
  onClose: () => void
  /** bottom = 手机端底部抽屉；right = 平板端右侧浮动面板 */
  side?: 'bottom' | 'right'
  heightVh?: number // side=bottom 时高度
  widthPx?: number // side=right 时宽度
  title?: string
  icon?: string
  children: ReactNode
}

/**
 * 通用抽屉 / 浮动面板。createPortal 到 body 规避 z-index 层叠；
 * translate + 200ms ease 滑入滑出；点击蒙层或 ✕ 关闭。平板浮动面板与手机底部抽屉共用此组件（side 控制方向）。
 */
export default function Sheet({ open, onClose, side = 'bottom', heightVh = 60, widthPx = 320, title, icon, children }: Props) {
  const [render, setRender] = useState(open)
  const [active, setActive] = useState(false)

  useEffect(() => {
    if (open) {
      setRender(true)
      const id = requestAnimationFrame(() => requestAnimationFrame(() => setActive(true)))
      return () => cancelAnimationFrame(id)
    }
    setActive(false)
    const t = setTimeout(() => setRender(false), 220)
    return () => clearTimeout(t)
  }, [open])

  if (!render || typeof document === 'undefined') return null

  const isBottom = side === 'bottom'
  const panelStyle = isBottom
    ? { height: `${heightVh}vh`, transform: active ? 'translateY(0)' : 'translateY(100%)' }
    : { width: widthPx, transform: active ? 'translateX(0)' : 'translateX(100%)' }

  return createPortal(
    <div className="fixed inset-0 z-[80]">
      <div
        className={`absolute inset-0 bg-ink/35 transition-opacity duration-200 ${active ? 'opacity-100' : 'opacity-0'}`}
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        className={`absolute flex flex-col bg-slate-0 shadow-pop-lg transition-transform duration-200 ease-out ${
          isBottom ? 'inset-x-0 bottom-0 rounded-t-2xl border-t-2 border-ink' : 'inset-y-0 right-0 border-l-2 border-ink'
        }`}
        style={panelStyle}
      >
        {isBottom && <div className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-slate-300" />}
        <div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-4 py-2.5">
          <span className="flex items-center gap-1.5 text-sm font-bold text-ink">
            {icon && <span>{icon}</span>}
            {title}
          </span>
          <button
            type="button"
            onClick={onClose}
            aria-label="关闭"
            className="touch-target grid place-items-center rounded-lg text-slate-600 transition-colors hover:bg-slate-100"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="scroll-thin min-h-0 flex-1 overflow-y-auto">{children}</div>
      </div>
    </div>,
    document.body,
  )
}
