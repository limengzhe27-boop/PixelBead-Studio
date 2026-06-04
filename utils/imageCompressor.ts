/**
 * 识别色号用的图片预处理。
 * 发送给 Qwen-VL 之前必须压缩，否则 base64 过大会被 API 拒绝 / 变慢。
 */

/** 压缩到指定最大边长，返回 **不含 data: 前缀** 的 base64（识别接口会自行拼上 data:image/jpeg;base64,）。 */
export function compressToBase64(file: File, maxSize = 800, quality = 0.85): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      const scale = Math.min(1, maxSize / Math.max(img.width, img.height))
      const w = Math.max(1, Math.round(img.width * scale))
      const h = Math.max(1, Math.round(img.height * scale))
      const canvas = document.createElement('canvas')
      canvas.width = w
      canvas.height = h
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        URL.revokeObjectURL(url)
        return reject(new Error('canvas 不可用'))
      }
      ctx.drawImage(img, 0, 0, w, h)
      URL.revokeObjectURL(url)
      resolve(canvas.toDataURL('image/jpeg', quality).split(',')[1])
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('图片解码失败'))
    }
    img.src = url
  })
}

/** 读取为 **完整** data URL（含 data: 前缀）——本项目 sourceImage 统一用完整 dataURL（供 <img>/loadImage 直接使用）。 */
export function fileToDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => resolve(e.target!.result as string)
    reader.onerror = () => reject(new Error('读取文件失败'))
    reader.readAsDataURL(file)
  })
}
