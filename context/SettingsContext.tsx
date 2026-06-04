'use client'

import { createContext, useContext, useState, type ReactNode } from 'react'

interface SettingsCtx {
  isOpen: boolean
  openSettings: () => void
  closeSettings: () => void
}

const Ctx = createContext<SettingsCtx | null>(null)

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  return (
    <Ctx.Provider value={{ isOpen, openSettings: () => setIsOpen(true), closeSettings: () => setIsOpen(false) }}>
      {children}
    </Ctx.Provider>
  )
}

export function useSettings() {
  const c = useContext(Ctx)
  if (!c) throw new Error('useSettings must be used within SettingsProvider')
  return c
}
