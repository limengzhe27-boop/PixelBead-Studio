import { loadImage } from './imageProcessor'

export interface PixelArea {
  x: number
  y: number
  width: number
  height: number
}

/**
 * 按 flipH/flipV 预翻转图片，返回新的完整 dataURL（都不翻转则原样返回）。
 * 让裁剪框的「预览」与「输出」用同一张翻转后的图，避免翻转预览与 react-easy-crop 自带 transform 打架。
 */
export async function flipDataURL(src: string, flipH: boolean, flipV: boolean): Promise<string> {
  if (!flipH && !flipV) return src
  const image = await loadImage(src)
  const w = image.naturalWidth || image.width
  const h = image.naturalHeight || image.height
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  if (!ctx) return src
  ctx.translate(flipH ? w : 0, flipV ? h : 0)
  ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1)
  ctx.drawImage(image, 0, 0)
  return canvas.toDataURL('image/png')
}

/**
 * 按 react-easy-crop 的 croppedAreaPixels(+rotation) 裁出区域，返回完整 dataURL。
 * 先把原图按 rotation 画到「旋转后包围盒」画布，再从中切出 pixelCrop 区域（与 react-easy-crop 坐标系一致）。
 */
export async function getCroppedDataURL(src: string, pixelCrop: PixelArea, rotation = 0): Promise<string> {
  const image = await loadImage(src)
  const w = image.naturalWidth || image.width
  const h = image.naturalHeight || image.height
  const rad = (rotation * Math.PI) / 180

  const bboxW = Math.abs(Math.cos(rad) * w) + Math.abs(Math.sin(rad) * h)
  const bboxH = Math.abs(Math.sin(rad) * w) + Math.abs(Math.cos(rad) * h)

  const tmp = document.createElement('canvas')
  tmp.width = Math.max(1, Math.round(bboxW))
  tmp.height = Math.max(1, Math.round(bboxH))
  const tctx = tmp.getContext('2d')
  if (!tctx) return src
  tctx.translate(tmp.width / 2, tmp.height / 2)
  tctx.rotate(rad)
  tctx.drawImage(image, -w / 2, -h / 2)

  const out = document.createElement('canvas')
  out.width = Math.max(1, Math.round(pixelCrop.width))
  out.height = Math.max(1, Math.round(pixelCrop.height))
  const octx = out.getContext('2d')
  if (!octx) return src
  octx.drawImage(
    tmp,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    out.width,
    out.height,
  )
  return out.toDataURL('image/png')
}
