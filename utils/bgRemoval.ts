/**
 * 智能去背景封装（功能1）。动态 import @imgly/background-removal —— 客户端按需加载。
 *
 * 两个曾经让它「不能用」的根因都已规避：
 * 1) **模型/wasm 自托管在 `public/imgly/`**（publicPath 指向本应用），不再依赖
 *    staticimgly.com —— 该 CDN 在中国大陆常被墙/极慢，是「去背景总失败」的主因。
 * 2) **onnxruntime-web 的 `new URL(..., import.meta.url)`**：webpack 默认会把它改写、
 *    在客户端打成构建期 file:// 路径 + 坏掉的 URL 垫片，模块加载即抛
 *    `TypeError: e.replace is not a function`。已在 `next.config.mjs` 用
 *    `parser: { url: false }` 关闭该改写（保留原生 new URL），见那里的注释。
 *
 * 模型用量化版 isnet_quint8（~44MB，单线程也够快），反正结果还会降采样成拼豆格子。
 * 返回去背后图片的 objectURL（PNG 带透明通道）。
 */
export type BgProgress = { phase: 'download' | 'process'; percent: number }

export async function removeBg(src: string, onProgress?: (p: BgProgress) => void): Promise<string> {
  const { removeBackground } = await import('@imgly/background-removal')
  const seen = new Map<string, { c: number; t: number }>() // 聚合各资源下载进度
  const blob = await removeBackground(src, {
    publicPath: `${window.location.origin}/imgly/`,
    model: 'isnet_quint8',
    progress: (key, current, total) => {
      if (!onProgress) return
      if (key.startsWith('fetch:')) {
        seen.set(key, { c: current, t: total })
        let c = 0
        let t = 0
        for (const v of seen.values()) {
          c += v.c
          t += v.t
        }
        onProgress({ phase: 'download', percent: t > 0 ? Math.min(99, Math.round((c / t) * 100)) : 0 })
      } else {
        onProgress({ phase: 'process', percent: 100 })
      }
    },
  })
  return URL.createObjectURL(blob)
}
