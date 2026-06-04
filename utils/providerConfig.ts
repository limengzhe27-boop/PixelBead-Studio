/**
 * 用户自带 API（BYOK）配置：三类能力各存一份「接口地址 + Key + 模型名」到 localStorage。
 * 仅保存在本地浏览器，请求时经请求头转发给服务端代理，服务器不存储。
 * 核心「图片转像素」是纯本地算法，无需任何配置。
 */
export type Capability = 'chat' | 'image' | 'vision'

export interface ProviderConfig {
  baseUrl: string // 如 https://api.siliconflow.cn/v1
  apiKey: string
  model: string // 如 black-forest-labs/FLUX.1-dev
}

const PREFIX = 'pixelbead_provider_'
const EMPTY: ProviderConfig = { baseUrl: '', apiKey: '', model: '' }

export function getProviderConfig(cap: Capability): ProviderConfig {
  if (typeof window === 'undefined') return { ...EMPTY }
  try {
    const raw = localStorage.getItem(PREFIX + cap)
    if (raw) return { ...EMPTY, ...JSON.parse(raw) }
  } catch {
    /* ignore */
  }
  return { ...EMPTY }
}

export function setProviderConfig(cap: Capability, cfg: ProviderConfig): void {
  try {
    localStorage.setItem(
      PREFIX + cap,
      JSON.stringify({
        baseUrl: cfg.baseUrl.trim().replace(/\/+$/, ''), // 去掉结尾斜杠
        apiKey: cfg.apiKey.trim(),
        model: cfg.model.trim(),
      }),
    )
  } catch {
    /* 隐私模式，静默失败 */
  }
}

export function clearProviderConfig(cap: Capability): void {
  try {
    localStorage.removeItem(PREFIX + cap)
  } catch {
    /* ignore */
  }
}

/** 配置是否完整（三项都有才算可用） */
export function hasProvider(cap: Capability): boolean {
  const c = getProviderConfig(cap)
  return !!(c.baseUrl && c.apiKey && c.model)
}

/** 取请求头：把某类能力的配置放进 X-* 头转发给路由 */
export function headersFor(cap: Capability): Record<string, string> {
  const c = getProviderConfig(cap)
  return {
    'Content-Type': 'application/json',
    'X-Api-Key': c.apiKey,
    'X-Base-Url': c.baseUrl,
    'X-Model': c.model,
  }
}
