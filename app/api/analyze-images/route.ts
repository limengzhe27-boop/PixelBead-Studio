import { NextResponse } from 'next/server'

export const maxDuration = 60

/**
 * 参考图片分析（BYOK·OpenAI 兼容视觉，多图）。失败 / 未配置 → 返回空描述 `{ description: '' }`，不阻断生图。
 */
export async function POST(req: Request) {
  const apiKey = req.headers.get('x-api-key')
  const baseUrl = req.headers.get('x-base-url')
  const model = req.headers.get('x-model')

  let images: string[] = []
  try {
    const body = await req.json()
    images = Array.isArray(body?.images) ? body.images : []
  } catch {
    /* ignore */
  }
  images = images.slice(0, 3).filter((b) => typeof b === 'string' && b.length > 0)

  if (!apiKey || !baseUrl || !model || images.length === 0) {
    return NextResponse.json({ description: '' })
  }

  const imageParts = images.map((b64) => ({
    type: 'image_url' as const,
    image_url: { url: b64.startsWith('data:') ? b64 : `data:image/jpeg;base64,${b64}` },
  }))

  try {
    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        max_tokens: 300,
        messages: [
          {
            role: 'system',
            content: '描述用户上传的参考图片主要内容（外观、颜色、风格），每张 20 字内，格式：图1：xxx；图2：xxx。只输出描述，不要其他内容。',
          },
          { role: 'user', content: [{ type: 'text', text: '请描述这些参考图片。' }, ...imageParts] },
        ],
      }),
    })
    if (!res.ok) {
      console.error('[analyze-images] 上游失败:', res.status)
      return NextResponse.json({ description: '' })
    }
    const data = await res.json()
    let raw: unknown = data?.choices?.[0]?.message?.content
    if (Array.isArray(raw)) raw = (raw as Array<{ text?: string }>).map((p) => p?.text ?? '').join('')
    return NextResponse.json({ description: typeof raw === 'string' ? raw.trim() : '' })
  } catch {
    return NextResponse.json({ description: '' })
  }
}
