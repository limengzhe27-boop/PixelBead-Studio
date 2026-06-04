import { useEffect, useRef } from 'react'
import type { PixelGrid } from '../types'
import { renderGrid, renderIroned } from '../utils/canvasRenderer'

interface Props {
  pixels: PixelGrid | null
  computing?: boolean
  ironed?: boolean // 烫后效果预览
}

/** 转换设置页右侧的像素预览。渲染到离屏分辨率，再用 CSS 等比缩放铺满容器。 */
export default function PixelPreview({ pixels, computing, ironed = false }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !pixels || pixels.length === 0) return
    const maxSide = Math.max(pixels.length, pixels[0].length)
    // 选取一个让长边落在 ~480px 的渲染 cellSize，CSS 再缩放显示
    const cellSize = Math.max(3, Math.min(18, Math.floor(480 / maxSide)))
    if (ironed) renderIroned(canvas, pixels, cellSize)
    else renderGrid(canvas, pixels, cellSize, false, undefined, { drawEmpty: true })
  }, [pixels, ironed])

  return (
    <div className="relative flex h-full w-full items-center justify-center">
      {pixels && pixels.length > 0 ? (
        <canvas
          ref={canvasRef}
          className="max-h-full max-w-full rounded-lg shadow-craft"
          style={{
            // 烫后用平滑缩放（圆珠），像素图纸用 pixelated；立体感由圆珠渲染本身实现，不再加滤镜
            imageRendering: ironed ? 'auto' : 'pixelated',
            objectFit: 'contain',
          }}
        />
      ) : (
        <div className="text-sm text-ink-faint">准备预览…</div>
      )}
      {computing && (
        <div className="absolute right-3 top-3 flex items-center gap-1.5 rounded-bead bg-ink/80 px-2.5 py-1 text-xs text-paper-50 backdrop-blur-sm">
          <span className="h-2.5 w-2.5 rounded-full border-2 border-paper-50/40 border-t-paper-50 animate-bead-spin" />
          计算中
        </div>
      )}
    </div>
  )
}
