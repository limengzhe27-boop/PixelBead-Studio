import { NextResponse } from 'next/server'

export const maxDuration = 60

/**
 * 图像生成（BYOK·OpenAI 兼容 images/generations）。用户自带 baseUrl/key/model。
 * 兼容返回：硅基流动 images[0].url / OpenAI data[0].url / data[0].b64_json。
 */
export async function POST(req: Request) {
  const apiKey = req.headers.get('x-api-key')
  const baseUrl = req.headers.get('x-base-url')
  const model = req.headers.get('x-model')

  let prompt = ''
  try {
    prompt = (await req.json())?.prompt ?? ''
  } catch {
    /* ignore */
  }

  if (!apiKey || !baseUrl || !model) {
    return NextResponse.json({ error: '图像生成模型未配置，请在 ⚙️ 设置中配置' }, { status: 401 })
  }
  if (!prompt.trim()) return NextResponse.json({ error: '提示词为空' }, { status: 400 })

  let res: Response
  try {
    res = await fetch(`${baseUrl}/images/generations`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      // 部分厂商（如 SiliconFlow）需要 image_size；多数 OpenAI 兼容服务会忽略未知字段
      body: JSON.stringify({ model, prompt, n: 1, image_size: '1024x1024' }),
    })
  } catch {
    return NextResponse.json({ error: '请求失败，请检查接口地址配置' }, { status: 502 })
  }

  if (res.status === 401 || res.status === 403) {
    return NextResponse.json({ error: 'API Key 无效或额度不足，请检查设置' }, { status: 401 })
  }
  if (!res.ok) {
    console.error('[generate-image] 上游失败:', res.status, (await res.text().catch(() => '')).slice(0, 200))
    return NextResponse.json({ error: `生图失败（${res.status}）` }, { status: 502 })
  }

  const data = await res.json()
  const url = data?.images?.[0]?.url ?? data?.data?.[0]?.url
  const b64 = data?.data?.[0]?.b64_json ?? data?.images?.[0]?.b64_json
  if (url) return NextResponse.json({ imageUrl: url })
  if (b64) return NextResponse.json({ imageUrl: `data:image/png;base64,${b64}` })

  console.error('[generate-image] 返回无图片:', JSON.stringify(data).slice(0, 200))
  return NextResponse.json({ error: '未获取到图片，请重试' }, { status: 502 })
}
