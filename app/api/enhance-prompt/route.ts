import { NextResponse } from 'next/server'

export const maxDuration = 60

/** 提示词优化（BYOK·文本/chat completions，OpenAI 兼容）。失败一律降级返回原文，不阻断生图。 */
export async function POST(req: Request) {
  const apiKey = req.headers.get('x-api-key')
  const baseUrl = req.headers.get('x-base-url')
  const model = req.headers.get('x-model')

  let description = ''
  try {
    const body = await req.json()
    description = body?.prompt ?? body?.description ?? ''
  } catch {
    /* ignore */
  }

  // 文本模型可选：没配 / 没描述 → 直接返回原文（不报错、不阻断）
  if (!apiKey || !baseUrl || !model || !description.trim()) {
    return NextResponse.json({ enhancedPrompt: description, prompt: description })
  }

  try {
    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        max_tokens: 220,
        messages: [
          {
            role: 'system',
            content:
              '你是图像生成提示词专家。把用户的中文图案描述扩写为一句高质量英文图像生成提示词：主体清晰居中、色彩鲜明、构图简洁、背景简单（便于转成像素拼豆），80 词以内。只输出英文提示词，不要解释、不要引号。',
          },
          { role: 'user', content: description },
        ],
      }),
    })
    if (!res.ok) {
      console.error('[enhance-prompt] 上游失败:', res.status)
      return NextResponse.json({ enhancedPrompt: description, prompt: description })
    }
    const data = await res.json()
    const out = data?.choices?.[0]?.message?.content?.trim() || description
    return NextResponse.json({ enhancedPrompt: out, prompt: out })
  } catch {
    return NextResponse.json({ enhancedPrompt: description, prompt: description })
  }
}
