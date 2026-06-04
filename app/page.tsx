'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useProject } from '@/context/ProjectContext'
import { useSettings } from '@/context/SettingsContext'
import BrandMark from '@/components/BrandMark'
import UploadZone from '@/components/UploadZone'
import AIGenerator from '@/components/AIGenerator'
import ColorRecognizer from '@/components/ColorRecognizer'
import SizeDialog from '@/components/SizeDialog'
import type { PixelGrid } from '@/types'

type Tab = 'upload' | 'ai' | 'recognize'

const MARQUEE = ['照着拼', '一颗一颗', 'ARTKAL 72 色', '导出图纸', '逐行施工', '小红书同款', 'AI 生成']

export default function HomePage() {
  const { state, dispatch } = useProject()
  const router = useRouter()
  const { openSettings } = useSettings()
  const [tab, setTab] = useState<Tab>('upload')
  const [showSize, setShowSize] = useState(false)

  const handleImage = (dataUrl: string) => {
    dispatch({ type: 'SET_SOURCE_IMAGE', payload: dataUrl })
    router.push('/convert')
  }

  const createBlank = (cols: number, rows: number) => {
    const empty: PixelGrid = Array.from({ length: rows }, () => Array.from({ length: cols }, () => null))
    dispatch({ type: 'SET_DIMENSIONS', payload: { cols, rows } })
    dispatch({ type: 'COMMIT_GRID', payload: empty })
    router.push('/editor')
  }

  return (
    <div className="min-h-full bg-pegboard">
      <header className="flex items-center justify-between px-4 py-4 sm:px-10 sm:py-5">
        <BrandMark />
        <button
          type="button"
          onClick={openSettings}
          className="flex min-h-[40px] items-center gap-1.5 rounded-bead border-2 border-ink bg-paper-50 px-3 py-1.5 text-sm font-bold text-ink shadow-sticker-sm transition-all hover:-translate-y-0.5"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
          <span className="hidden sm:inline">设置</span>
        </button>
      </header>

      <main className="mx-auto flex w-full max-w-[560px] flex-col items-center px-4 pb-16 pt-4 sm:px-5 sm:pt-12">
        <div className="mb-9 text-center animate-fade-up">
          <span className="tag tag--blue mb-5">
            <span className="h-1.5 w-1.5 rounded-full bg-white" />
            手作像素图纸工作台
          </span>
          <h1 className="offset-ink text-balance font-sans text-[clamp(34px,9vw,56px)] font-black leading-[1.06] text-ink">
            把喜欢的图，
            <br />
            拼成<span className="hl">真的</span>。
          </h1>
          <p className="mx-auto mt-5 max-w-[420px] text-[15px] leading-[1.75] text-ink-soft">
            上传一张图片或用 AI 生成，即刻得到带 Artkal 色号的拼豆像素图纸，
            可编辑、可打印、照着一颗颗拼出来。
          </p>
        </div>

        <div className="w-full card-riso p-2 animate-fade-up [animation-delay:80ms]">
          <div className="grid grid-cols-3 gap-1 rounded-2xl border-2 border-ink bg-paper-200 p-1">
            <TabButton active={tab === 'upload'} onClick={() => setTab('upload')} label="上传图片" short="上传" icon="upload" />
            <TabButton active={tab === 'ai'} onClick={() => setTab('ai')} label="AI 生成" short="AI生成" icon="ai" />
            <TabButton active={tab === 'recognize'} onClick={() => setTab('recognize')} label="成品转图纸" short="成品转图" icon="scan" />
          </div>
          <div className="p-4 pt-5 sm:p-5">
            {tab === 'upload' && <UploadZone onImage={handleImage} />}
            {tab === 'ai' && <AIGenerator onImage={handleImage} />}
            {tab === 'recognize' && <ColorRecognizer />}
          </div>
          {tab !== 'upload' && (
            <p className="px-4 pb-4 text-center text-[11px] leading-relaxed text-ink-faint sm:px-5">
              使用此功能需先在{' '}
              <button type="button" onClick={openSettings} className="link font-bold">⚙️ 设置</button>{' '}
              中配置 AI 服务（支持任何 OpenAI 兼容厂商，推荐有免费额度的硅基流动 / 阿里云百炼）
            </p>
          )}
        </div>

        <button type="button" onClick={() => setShowSize(true)} className="mt-6 link inline-flex min-h-[44px] items-center text-base font-bold animate-fade-up [animation-delay:160ms] sm:text-sm">
          或，从一张空白图纸开始手绘 →
        </button>

        {state.sourceImage && (
          <button type="button" onClick={() => router.push('/convert')} className="mt-3 text-xs text-ink-faint hover:text-ink">
            ↩ 继续上次的转换
          </button>
        )}
      </main>

      <div className="marquee mt-2 bg-paper-50 py-3">
        <div className="marquee__track animate-marquee">
          {[...MARQUEE, ...MARQUEE].map((w, i) => (
            <span key={i} className="flex items-center gap-10">
              <span className="font-sans text-2xl font-black text-ink">{w}</span>
              <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-coral" />
            </span>
          ))}
        </div>
      </div>

      {showSize && <SizeDialog onStart={createBlank} onClose={() => setShowSize(false)} />}
    </div>
  )
}

function TabButton({
  active,
  onClick,
  label,
  short,
  icon,
}: {
  active: boolean
  onClick: () => void
  label: string
  short: string
  icon: 'upload' | 'ai' | 'scan'
}) {
  const paths: Record<string, JSX.Element> = {
    upload: <path d="M12 16V4m0 0L7 9m5-5 5 5M4 20h16" />,
    ai: <path d="M12 3v3m0 12v3M5.6 5.6l2.1 2.1m8.6 8.6 2.1 2.1M3 12h3m12 0h3" />,
    scan: <path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2M3 12h18" />,
  }
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl py-2.5 text-[13px] font-bold transition-all sm:text-sm ${
        active ? 'bg-ink text-paper-50' : 'text-ink-soft hover:text-ink'
      }`}
    >
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        {paths[icon]}
      </svg>
      {/* 桌面端全称，平板/手机端短标题 */}
      <span className="lg:hidden">{short}</span>
      <span className="hidden lg:inline">{label}</span>
    </button>
  )
}
