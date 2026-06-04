import { NextResponse } from 'next/server'

export const maxDuration = 60

/**
 * 成品照片识别（BYOK·OpenAI 兼容视觉 chat/completions，messages + image_url）。
 * **只让视觉模型估算网格行列数**（它能胜任的轻任务）；真正逐格取色由客户端 /convert 的成熟管线完成。
 * 实测让 VL 模型直接输出整张大网格不可靠（常返回空/错网格），故只取 {rows,cols}。
 */
const MIN = 4
const MAX = 256
const clamp = (n: number) => Math.max(MIN, Math.min(MAX, Math.round(n)))

export async function POST(req: Request) {
  const apiKey = req.headers.get('x-api-key')
  const baseUrl = req.headers.get('x-base-url')
  const model = req.headers.get('x-model')

  let imageBase64 = ''
  try {
    const body = await req.json()
    imageBase64 = body?.imageBase64 ?? body?.image ?? ''
  } catch {
    /* ignore */
  }

  if (!apiKey || !baseUrl || !model) {
    return NextResponse.json({ error: '视觉模型未配置，请在 ⚙️ 设置中配置' }, { status: 401 })
  }
  if (!imageBase64) return NextResponse.json({ error: '未接收到图片数据' }, { status: 400 })
  const dataUrl = imageBase64.startsWith('data:') ? imageBase64 : `data:image/jpeg;base64,${imageBase64}`

  const sys = `你是拼豆成品照片分析助手。数出照片里横向有多少颗豆（列数 cols）、纵向有多少颗豆（行数 rows）。
沿一整行、一整列仔细数清，注意每颗圆豆之间的网格间隔。只输出 JSON，不要任何解释：{"rows":行数,"cols":列数}`

  let res: Response
  try {
    res = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        max_tokens: 100,
        messages: [
          { role: 'system', content: sys },
          {
            role: 'user',
            content: [
              { type: 'text', text: '数出这张拼豆照片的行数和列数，只输出 JSON。' },
              { type: 'image_url', image_url: { url: dataUrl } },
            ],
          },
        ],
      }),
    })
  } catch {
    return NextResponse.json({ error: '网络错误，请检查接口地址配置' }, { status: 502 })
  }

  if (res.status === 401 || res.status === 403) {
    return NextResponse.json({ error: 'API Key 无效或额度不足，请检查设置' }, { status: 401 })
  }
  if (!res.ok) {
    console.error('[recognize-colors] 上游失败:', res.status, (await res.text().catch(() => '')).slice(0, 200))
    return NextResponse.json({ error: `识别服务异常（${res.status}）` }, { status: 502 })
  }

  const data = await res.json()
  let raw: unknown = data?.choices?.[0]?.message?.content
  if (Array.isArray(raw)) raw = (raw as Array<{ text?: string }>).map((p) => p?.text ?? '').join('')
  const text = typeof raw === 'string' ? raw : ''
  const m = text.replace(/```json|```/gi, '').match(/\{[\s\S]*?\}/)
  let rows = 0
  let cols = 0
  try {
    const o = JSON.parse(m ? m[0] : text)
    rows = Number(o?.rows)
    cols = Number(o?.cols)
  } catch {
    /* fallthrough */
  }
  if (!Number.isFinite(rows) || !Number.isFinite(cols) || rows < 1 || cols < 1) {
    return NextResponse.json({ error: '未能估算网格尺寸，请用更清晰的俯拍照片' }, { status: 422 })
  }
  return NextResponse.json({ rows: clamp(rows), cols: clamp(cols) })
}
