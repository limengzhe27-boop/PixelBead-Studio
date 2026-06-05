import './globals.css'
import type { Metadata, Viewport } from 'next'
import type { ReactNode } from 'react'
import { ProjectProvider } from '@/context/ProjectContext'
import { SettingsProvider } from '@/context/SettingsContext'
import { PaletteProvider } from '@/context/PaletteContext'
import ProviderSettingsModal from '@/components/ProviderSettingsModal'

export const metadata: Metadata = {
  title: 'PixelBead Studio · 拼豆像素图纸工作台',
  description:
    'PixelBead Studio —— 把任意图片或 AI 生成转换为拼豆像素图纸，标注 Artkal 色号，支持编辑、逐行施工指南与打印导出。',
}

// 移动端按设备宽度铺满、禁用浏览器双指缩放（缩放交给画布手势处理）
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

const FAVICON =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='7' fill='%23FF4D6D'/%3E%3Ccircle cx='16' cy='16' r='9' fill='none' stroke='%23FBF7EF' stroke-width='3'/%3E%3Ccircle cx='16' cy='16' r='3' fill='%23FBF7EF'/%3E%3C/svg%3E"

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="zh-CN">
      <head>
        <link rel="icon" href={FAVICON} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500..800&family=Noto+Sans+SC:wght@400;500;700;900&family=Space+Mono:wght@400;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <ProjectProvider>
          <PaletteProvider>
            <SettingsProvider>
              {children}
              <ProviderSettingsModal />
            </SettingsProvider>
          </PaletteProvider>
        </ProjectProvider>
      </body>
    </html>
  )
}
