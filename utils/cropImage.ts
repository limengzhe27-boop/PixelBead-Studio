import { loadImage } from './imageProcessor'

export interface PercentArea {
  x: number
  y: number
  width: number
  height: number
}

function mimeOf(src: string): string {
  // PNG 保留透明；其余（照片）用 JPEG，避免大图 PNG dataURL 占用过多内存
  return /^data:image\/png/i.test(src) ? 'image/png' : 'image/jpeg'
}

/**
 * 取「EXIF 校正后正立」的位图。手机照片常带 EXIF 旋转信息，直接画到 canvas 会横躺/倒置，
 * 用 createImageBitmap(..., { imageOrientation: 'from-image' }) 让其正立。
 * 不支持时退回普通 <img>（无 EXIF 校正，但用户可用旋转按钮手动纠正兜底）。
 */
async function getUpright(src: string): Promise<ImageBitmap | HTMLImageElement> {
  try {
    const blob = await (await fetch(src)).blob()
    return await createImageBitmap(blob, { imageOrientation: 'from-image' })
  } catch {
    return loadImage(src)
  }
}

function dimsOf(img: ImageBitmap | HTMLImageElement): { w: number; h: number } {
  const w = (img as HTMLImageElement).naturalWidth || img.width
  const h = (img as HTMLImageElement).naturalHeight || img.height
  return { w, h }
}

/**
 * 把「EXIF 正立图 + 旋转(90°步进) + 翻转」烘焙成一张正向显示的新图（dataURL）。
 * 关键：旋转/翻转不是 CSS 显示变换，而是真实重画成新图——裁剪框始终对「当前这张正向图」操作，
 * 框与图永远对得上，不会裁错或变形。
 */
export async function bakeUpright(src: string, rotation: number, flipH: boolean, flipV: boolean): Promise<string> {
  const img = await getUpright(src)
  const { w, h } = dimsOf(img)
  const norm = (((rotation % 360) + 360) % 360)
  const rad = norm * (Math.PI / 180)
  const swap = norm % 180 !== 0
  const cw = Math.max(1, swap ? h : w)
  const ch = Math.max(1, swap ? w : h)
  const canvas = document.createElement('canvas')
  canvas.width = cw
  canvas.height = ch
  const ctx = canvas.getContext('2d')
  if (!ctx) return src
  ctx.translate(cw / 2, ch / 2)
  ctx.rotate(rad)
  ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1)
  ctx.drawImage(img as CanvasImageSource, -w / 2, -h / 2)
  ;(img as ImageBitmap).close?.()
  return canvas.toDataURL(mimeOf(src), 0.92)
}

/**
 * 按百分比裁剪框在「原图分辨率」上裁出区域，返回完整 dataURL。
 * react-image-crop 给的坐标是屏幕显示像素，手机上图是缩小显示的；用百分比 × naturalWidth
 * 换算回原图分辨率再裁，保证清晰（不是屏幕低清图）。
 */
export async function cropToDataURL(displaySrc: string, crop: PercentArea): Promise<string> {
  const img = await loadImage(displaySrc)
  const nw = img.naturalWidth || img.width
  const nh = img.naturalHeight || img.height
  const x = Math.max(0, Math.round((crop.x / 100) * nw))
  const y = Math.max(0, Math.round((crop.y / 100) * nh))
  const cw = Math.max(1, Math.round((crop.width / 100) * nw))
  const ch = Math.max(1, Math.round((crop.height / 100) * nh))
  const canvas = document.createElement('canvas')
  canvas.width = cw
  canvas.height = ch
  const ctx = canvas.getContext('2d')
  if (!ctx) return displaySrc
  ctx.drawImage(img, x, y, cw, ch, 0, 0, cw, ch)
  return canvas.toDataURL(mimeOf(displaySrc), 0.92)
}
