'use client'

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { DEFAULT_PALETTE_ID, getPaletteById, type BeadPalette } from '@/data/palettes'
import type { ColorEntry } from '@/types'

const KEY = 'pixelbead_palette_id'

interface PaletteCtx {
  paletteId: string
  palette: BeadPalette // 当前品牌（含 name / beadSizeMm）
  colors: ColorEntry[] // 桥接成既有 ColorEntry 形状（name_cn 留空，只用 code/hex），下游组件无需改动
  choose: (id: string) => void
}

const Ctx = createContext<PaletteCtx | null>(null)

/** 把新调色板的 {code,hex} 桥接成既有 ColorEntry（name 留空，UI 只展示真实色号 code） */
function toColorEntries(p: BeadPalette): ColorEntry[] {
  return p.colors.map((c) => ({ code: c.code, hex: c.hex, name_cn: '', name_en: '' }))
}

export function PaletteProvider({ children }: { children: ReactNode }) {
  const [paletteId, setPaletteId] = useState(DEFAULT_PALETTE_ID)

  useEffect(() => {
    try {
      const s = localStorage.getItem(KEY)
      if (s && getPaletteById(s).id === s) setPaletteId(s)
    } catch {
      /* ignore */
    }
  }, [])

  const choose = (id: string) => {
    setPaletteId(id)
    try {
      localStorage.setItem(KEY, id)
    } catch {
      /* ignore */
    }
  }

  // palette / colors 按 paletteId 记忆，保证数组引用稳定（getPaletteRGB 的 WeakMap 缓存、useMemo 依赖都依赖它）
  const palette = useMemo(() => getPaletteById(paletteId), [paletteId])
  const colors = useMemo(() => toColorEntries(palette), [palette])

  return <Ctx.Provider value={{ paletteId, palette, colors, choose }}>{children}</Ctx.Provider>
}

export function usePalette() {
  const c = useContext(Ctx)
  if (!c) throw new Error('usePalette must be used within PaletteProvider')
  return c
}
