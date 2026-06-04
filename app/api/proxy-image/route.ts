import { NextResponse } from 'next/server'

export const maxDuration = 30

/**
 * 同源图片代理：客户端拿到生图返回的硅基流动图片 URL 后，经此代理下载，
 * 规避浏览器直接 fetch 跨域图片的 CORS 限制（否则进 canvas 会被污染、无法转像素）。
 */
export async function GET(req: Request) {
  const url = new URL(req.url).searchParams.get('url')
  if (!url) return NextResponse.json({ error: '缺少 url 参数' }, { status: 400 })
  // 只允许代理 http(s)，避免被当作 SSRF 跳板访问内网/文件
  if (!/^https?:\/\//i.test(url)) return NextResponse.json({ error: '非法的 url' }, { status: 400 })

  let res: Response
  try {
    res = await fetch(url)
  } catch {
    return NextResponse.json({ error: '下载图片失败' }, { status: 502 })
  }
  if (!res.ok) return NextResponse.json({ error: '下载图片失败' }, { status: 502 })

  const buf = await res.arrayBuffer()
  const ct = res.headers.get('content-type')
  // S3/CDN 常返回 application/octet-stream，强制图片 MIME 以便浏览器可靠解码
  const mime = ct && ct.startsWith('image/') ? ct : 'image/png'
  return new NextResponse(buf, {
    headers: { 'Content-Type': mime, 'Cache-Control': 'public, max-age=3600' },
  })
}
