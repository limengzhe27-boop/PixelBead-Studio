/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config) => {
    // onnxruntime-web（@imgly/background-removal 依赖）的预构建 .mjs 用了 import.meta，
    // 需按模块解析、避免被当成脚本压缩报错。
    config.module.rules.push({
      test: /\.mjs$/,
      include: /node_modules/,
      type: 'javascript/auto',
      // 关闭 webpack 对 `new URL(..., import.meta.url)` 的改写：onnxruntime-web
      // （@imgly/background-removal 依赖）在客户端被改写后会拿到构建期 file:// 路径 +
      // 坏掉的 URL 垫片，模块加载即抛 `e.replace is not a function`（去背景崩溃）。
      // 关掉后保留原生 new URL；onnxruntime 的 wasm 路径本就由 @imgly 的 publicPath 覆盖。
      parser: { url: false },
    })
    config.resolve.fallback = { ...(config.resolve.fallback || {}), fs: false, path: false, crypto: false }
    return config
  },
  // 自托管的去背景模型/wasm（public/imgly/，文件名即内容哈希）→ 永久缓存，下载一次即可
  async headers() {
    return [
      {
        source: '/imgly/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
    ]
  },
}

export default nextConfig
