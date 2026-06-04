'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'

interface Props {
  title: string
  desc?: string
  shortcut?: string
  side?: 'right' | 'left' | 'top' | 'bottom'
  delay?: number
  children: ReactNode
}

/**
 * 可复用 Tooltip：深色小气泡，默认出现在右侧，悬停 500ms 后显示。
 * 用 fixed 定位（按触发元素的 boundingRect 计算），避免被父级 overflow/transform 裁剪。
 */
export default function Tooltip({ title, desc, shortcut, side = 'right', delay = 500, children }: Props) {
  const ref = useRef<HTMLSpanElement>(null)
  const timer = useRef<number | null>(null)
  const touchedAt = useRef(0)
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null)

  const clear = () => {
    if (timer.current) window.clearTimeout(timer.current)
    timer.current = null
  }
  const show = () => {
    clear()
    timer.current = window.setTimeout(() => {
      const el = ref.current
      if (!el) return
      const r = el.getBoundingClientRect()
      const gap = 10
      if (side === 'left') setPos({ x: r.left - gap, y: r.top + r.height / 2 })
      else if (side === 'top') setPos({ x: r.left + r.width / 2, y: r.top - gap })
      else if (side === 'bottom') setPos({ x: r.left + r.width / 2, y: r.bottom + gap })
      else setPos({ x: r.right + gap, y: r.top + r.height / 2 })
    }, delay)
  }
  const hide = () => {
    clear()
    setPos(null)
  }

  useEffect(() => clear, [])

  // 外层 fixed 定位 + translate 把气泡锚到目标边；内层负责 pop-in 动画（避免 transform 冲突）
  const anchor =
    side === 'left'
      ? 'translate(-100%, -50%)'
      : side === 'top'
        ? 'translate(-50%, -100%)'
        : side === 'bottom'
          ? 'translate(-50%, 0)'
          : 'translate(0, -50%)'
  const arrowCls =
    side === 'left'
      ? '-right-1 top-1/2 -translate-y-1/2'
      : side === 'top'
        ? '-bottom-1 left-1/2 -translate-x-1/2'
        : side === 'bottom'
          ? '-top-1 left-1/2 -translate-x-1/2'
          : '-left-1 top-1/2 -translate-y-1/2'

  return (
    <span
      ref={ref}
      className="inline-flex"
      onMouseEnter={() => {
        if (Date.now() - touchedAt.current < 700) return // 忽略触摸后合成的 mouseenter
        show()
      }}
      onMouseLeave={hide}
      onMouseDown={hide}
      onTouchStart={() => {
        touchedAt.current = Date.now()
        show() // 移动端：长按 ≥500ms 弹出说明
      }}
      onTouchMove={hide}
      onTouchEnd={(e) => {
        if (pos) e.preventDefault() // 长按已弹出 → 抑制本次点击（仅查看，不触发动作）
        hide()
      }}
    >
      {children}
      {pos && (
        <span className="pointer-events-none fixed z-[60]" style={{ left: pos.x, top: pos.y, transform: anchor }}>
          <span role="tooltip" className="relative block w-max max-w-[220px] rounded-lg bg-ink px-3 py-2 text-left shadow-lg animate-pop-in">
            <span className={`absolute h-2 w-2 rotate-45 bg-ink ${arrowCls}`} />
            <span className="flex items-center gap-2 whitespace-nowrap">
              <span className="text-xs font-bold text-white">{title}</span>
              {shortcut && (
                <span className="rounded border border-white/25 bg-white/10 px-1 font-mono text-[10px] leading-tight text-white/90">
                  {shortcut}
                </span>
              )}
            </span>
            {desc && <span className="mt-1 block text-[11px] leading-snug text-white/65">{desc}</span>}
          </span>
        </span>
      )}
    </span>
  )
}
