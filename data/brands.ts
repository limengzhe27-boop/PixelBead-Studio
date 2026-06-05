import type { ColorEntry } from '../types'
import { ARTKAL_MIDI_PALETTE } from './artkal'
import { ARTKAL_MINI_PALETTE } from './artkal-mini'
import { PERLER_PALETTE } from './perler'
import { HAMA_PALETTE } from './hama'
import { PALETTES } from './palettes'

/** 拼豆品牌（多品牌色卡，功能1） */
export interface Brand {
  id: string
  label: string
  mm: string
  palette: ColorEntry[]
}

export const BRANDS: Brand[] = [
  // 2.6mm C 系列即 Artkal Mini（此前误标 Midi，Midi 实为 5.0mm）；变量名 ARTKAL_MIDI_PALETTE 保留不动
  { id: 'artkal-midi', label: 'Artkal Mini', mm: '2.6mm', palette: ARTKAL_MIDI_PALETTE },
  { id: 'artkal-mini', label: 'Artkal Mini 2.0', mm: '2.0mm', palette: ARTKAL_MINI_PALETTE },
  { id: 'perler', label: 'Perler', mm: '2.6mm', palette: PERLER_PALETTE },
  { id: 'hama', label: 'Hama', mm: '2.5mm', palette: HAMA_PALETTE },
]

export const DEFAULT_BRAND = 'artkal-midi'

export function getBrand(id: string): Brand {
  return BRANDS.find((b) => b.id === id) ?? BRANDS[0]
}

// 全局 hex → ColorEntry（跨所有调色板，先到先得），用于撤销/切换后仍能解析真实色号。
// 优先新调色板（Mard / Artkal-S），再补旧品牌，保证新系统的色号优先命中。
const GLOBAL_BY_HEX = new Map<string, ColorEntry>()
for (const p of PALETTES) {
  for (const c of p.colors) {
    const k = c.hex.toUpperCase()
    if (!GLOBAL_BY_HEX.has(k)) GLOBAL_BY_HEX.set(k, { code: c.code, hex: c.hex, name_cn: '', name_en: '' })
  }
}
for (const b of BRANDS) {
  for (const c of b.palette) {
    const k = c.hex.toUpperCase()
    if (!GLOBAL_BY_HEX.has(k)) GLOBAL_BY_HEX.set(k, c)
  }
}

/**
 * 解析 hex 的色号信息：优先用当前激活品牌的色卡，找不到再回退到全局跨品牌查找。
 * 这样当前品牌的色号显示准确，撤销到其它品牌色时也不至于显示空。
 */
export function resolveColor(hex: string, palette?: ColorEntry[]): ColorEntry | undefined {
  const key = hex.toUpperCase()
  if (palette) {
    const hit = palette.find((c) => c.hex.toUpperCase() === key)
    if (hit) return hit
  }
  return GLOBAL_BY_HEX.get(key)
}
