'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { getProviderConfig, setProviderConfig, clearProviderConfig, type Capability, type ProviderConfig } from '@/utils/providerConfig'
import { useSettings } from '@/context/SettingsContext'

interface Preset {
  name: string
  baseUrl: string
  model: string
  note?: string
}

// 每类能力的厂商预设（选中后自动填 baseUrl 和 model，仍可手动改）
const PRESETS: Record<Capability, Preset[]> = {
  image: [
    { name: '硅基流动 Kolors', baseUrl: 'https://api.siliconflow.cn/v1', model: 'Kwai-Kolors/Kolors', note: '有免费额度·推荐' },
    { name: '硅基流动 FLUX.1', baseUrl: 'https://api.siliconflow.cn/v1', model: 'black-forest-labs/FLUX.1-dev', note: '需开通该模型' },
    { name: 'OpenAI DALL·E 3', baseUrl: 'https://api.openai.com/v1', model: 'dall-e-3', note: '需付费' },
    { name: '自定义', baseUrl: '', model: '' },
  ],
  vision: [
    { name: '阿里云百炼 Qwen-VL', baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1', model: 'qwen-vl-max', note: '有免费额度·推荐' },
    { name: 'OpenAI GPT-4o', baseUrl: 'https://api.openai.com/v1', model: 'gpt-4o', note: '需付费' },
    { name: '自定义', baseUrl: '', model: '' },
  ],
  chat: [
    { name: '阿里云百炼 Qwen', baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1', model: 'qwen-plus', note: '有免费额度·推荐' },
    { name: 'DeepSeek', baseUrl: 'https://api.deepseek.com/v1', model: 'deepseek-chat', note: '需付费' },
    { name: 'OpenAI', baseUrl: 'https://api.openai.com/v1', model: 'gpt-4o-mini', note: '需付费' },
    { name: '自定义', baseUrl: '', model: '' },
  ],
}

const CAP_INFO: { id: Capability; title: string; usage: string; required: boolean }[] = [
  { id: 'image', title: '图像生成模型', usage: 'AI 生成图片', required: true },
  { id: 'vision', title: '视觉模型', usage: '成品转图纸 / 参考图识别', required: true },
  { id: 'chat', title: '文本模型', usage: '提示词优化', required: false },
]

const emptyConfigs = (): Record<Capability, ProviderConfig> => ({
  chat: { baseUrl: '', apiKey: '', model: '' },
  image: { baseUrl: '', apiKey: '', model: '' },
  vision: { baseUrl: '', apiKey: '', model: '' },
})

export default function ProviderSettingsModal() {
  const { isOpen, closeSettings } = useSettings()
  const [configs, setConfigs] = useState<Record<Capability, ProviderConfig>>(emptyConfigs)
  const [showKey, setShowKey] = useState<Record<string, boolean>>({})

  useEffect(() => {
    if (isOpen) {
      setConfigs({ chat: getProviderConfig('chat'), image: getProviderConfig('image'), vision: getProviderConfig('vision') })
    }
  }, [isOpen])

  if (!isOpen || typeof document === 'undefined') return null

  const applyPreset = (cap: Capability, preset: Preset) => {
    setConfigs((prev) => ({ ...prev, [cap]: { ...prev[cap], baseUrl: preset.baseUrl, model: preset.model } }))
  }
  const update = (cap: Capability, field: keyof ProviderConfig, val: string) => {
    setConfigs((prev) => ({ ...prev, [cap]: { ...prev[cap], [field]: val } }))
  }
  const handleSave = () => {
    ;(['chat', 'image', 'vision'] as Capability[]).forEach((cap) => {
      const c = configs[cap]
      if (c.baseUrl && c.apiKey && c.model) setProviderConfig(cap, c)
      else clearProviderConfig(cap)
    })
    closeSettings()
  }

  return createPortal(
    <div className="fixed inset-0 z-[90] grid place-items-center bg-ink/45 p-3 backdrop-blur-sm sm:p-4" onClick={closeSettings}>
      <div
        className="flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-3xl border-2 border-ink bg-paper-50 shadow-pop-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-center justify-between border-b-2 border-ink px-5 py-3.5">
          <h2 className="font-display text-lg font-extrabold text-ink">⚙️ AI 服务设置</h2>
          <button onClick={closeSettings} aria-label="关闭" className="grid h-8 w-8 place-items-center rounded-lg text-ink-soft hover:bg-paper-200">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="scroll-thin min-h-0 flex-1 space-y-5 overflow-y-auto px-5 py-4">
          <p className="rounded-xl bg-paper-100 px-3.5 py-2.5 text-xs leading-relaxed text-ink-soft">
            AI 功能支持<strong className="text-ink"> 任何 OpenAI 兼容服务商</strong>。配置仅存在你的本地浏览器、只用于转发请求，服务器不存储。
            <strong className="text-ink"> 图片转像素无需任何配置即可使用。</strong>
          </p>

          {CAP_INFO.map((cap) => (
            <section key={cap.id} className="space-y-2.5 rounded-2xl border-2 border-paper-300 p-3.5">
              <div className="flex items-baseline gap-2">
                <h3 className="text-sm font-bold text-ink">{cap.title}</h3>
                <span className="text-xs text-ink-faint">{cap.usage}</span>
                <span className={`ml-auto rounded-bead px-2 py-0.5 text-[10px] font-bold ${cap.required ? 'bg-coral text-white' : 'bg-paper-300 text-ink-soft'}`}>
                  {cap.required ? '必需' : '可选'}
                </span>
              </div>

              {/* 预设 */}
              <div className="flex flex-wrap gap-1.5">
                {PRESETS[cap.id].map((p) => (
                  <button
                    key={p.name}
                    type="button"
                    onClick={() => applyPreset(cap.id, p)}
                    className="rounded-bead border-[1.5px] border-ink bg-paper-50 px-2.5 py-1 text-[11px] font-bold text-ink transition-all hover:bg-sun"
                  >
                    {p.name}
                    {p.note ? <span className="font-normal text-ink-soft">（{p.note}）</span> : null}
                  </button>
                ))}
              </div>

              {/* 字段 */}
              <Field label="接口地址 Base URL" value={configs[cap.id].baseUrl} placeholder="https://api.siliconflow.cn/v1" onChange={(v) => update(cap.id, 'baseUrl', v)} />
              <div>
                <label className="mb-1 block text-[11px] font-medium text-ink-soft">API Key</label>
                <div className="flex gap-1.5">
                  <input
                    type={showKey[cap.id] ? 'text' : 'password'}
                    value={configs[cap.id].apiKey}
                    onChange={(e) => update(cap.id, 'apiKey', e.target.value)}
                    placeholder="sk-..."
                    className="min-h-[40px] flex-1 rounded-lg border-2 border-paper-300 bg-white px-3 py-1.5 font-mono text-sm text-ink outline-none focus:border-ink"
                  />
                  <button
                    type="button"
                    onClick={() => setShowKey((s) => ({ ...s, [cap.id]: !s[cap.id] }))}
                    className="shrink-0 rounded-lg border-2 border-paper-300 px-2.5 text-xs text-ink-soft hover:border-ink"
                  >
                    {showKey[cap.id] ? '隐藏' : '显示'}
                  </button>
                </div>
              </div>
              <Field label="模型名 Model" value={configs[cap.id].model} placeholder="Kwai-Kolors/Kolors" onChange={(v) => update(cap.id, 'model', v)} mono />
            </section>
          ))}

          {/* 获取指引 */}
          <details className="rounded-2xl border-2 border-paper-300 px-3.5 py-2.5 text-xs leading-relaxed text-ink-soft">
            <summary className="cursor-pointer font-bold text-ink">如何获取 API Key？</summary>
            <div className="mt-2 space-y-2">
              <p className="font-bold text-ink">推荐（均有新用户免费额度）：</p>
              <ul className="list-disc space-y-1.5 pl-4">
                <li>
                  <b>图像生成 → 硅基流动</b>：访问 cloud.siliconflow.cn 注册（赠免费额度），实名后在「API 密钥」创建；地址填 https://api.siliconflow.cn/v1，模型用 Kwai-Kolors/Kolors。
                </li>
                <li>
                  <b>视觉 / 文本 → 阿里云百炼</b>：访问 dashscope.console.aliyun.com 登录开通百炼（有免费额度），右上角「API-KEY」创建；地址填 https://dashscope.aliyuncs.com/compatible-mode/v1。
                </li>
              </ul>
              <p>
                <b className="text-ink">其他厂商：</b>任何 OpenAI 兼容服务都可用（OpenAI、OpenRouter、Moonshot、智谱等），把对方的接口地址、Key、模型名填进对应栏即可。
              </p>
            </div>
          </details>
        </div>

        <div className="flex shrink-0 items-center justify-end gap-3 border-t-2 border-ink px-5 py-3.5">
          <button onClick={closeSettings} className="btn-ghost py-2">取消</button>
          <button onClick={handleSave} className="btn-cta py-2.5">保存</button>
        </div>
      </div>
    </div>,
    document.body,
  )
}

function Field({ label, value, placeholder, onChange, mono }: { label: string; value: string; placeholder: string; onChange: (v: string) => void; mono?: boolean }) {
  return (
    <div>
      <label className="mb-1 block text-[11px] font-medium text-ink-soft">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`min-h-[40px] w-full rounded-lg border-2 border-paper-300 bg-white px-3 py-1.5 text-sm text-ink outline-none focus:border-ink ${mono ? 'font-mono' : ''}`}
      />
    </div>
  )
}
