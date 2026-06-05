import type { ColorEntry, LegendItem, PixelGrid } from '../types'
import { resolveColor } from '../data/brands'

/**
 * 生成图例数据（PRD §F5 / §7）
 * 颜色按使用频次降序排列，分配显示序号（用量最多的序号为 1）。
 */
export function buildLegend(pixels: PixelGrid, palette?: ColorEntry[]): LegendItem[] {
  const freq = new Map<string, number>()
  let total = 0
  for (const row of pixels) {
    for (const cell of row) {
      if (cell) {
        const key = cell.toUpperCase()
        freq.set(key, (freq.get(key) ?? 0) + 1)
        total++
      }
    }
  }

  const sorted = [...freq.entries()].sort((a, b) => {
    if (b[1] !== a[1]) return b[1] - a[1] // 频次降序
    return a[0].localeCompare(b[0]) // 频次相同按 hex 稳定排序
  })

  return sorted.map(([hex, count], i) => {
    const entry = resolveColor(hex, palette)
    return {
      index: i + 1,
      hex,
      artkalCode: entry?.code ?? '—',
      name_cn: entry?.name_cn ?? '自定义',
      name_en: entry?.name_en ?? 'Custom',
      count,
      percentage: total > 0 ? Math.round((count / total) * 1000) / 10 : 0,
    }
  })
}

/** hex（大写）→ 真实色号（如 A13 / H7），供 renderGrid 在格子上显示真实色号（不再是顺序编号） */
export function buildLegendMap(legend: LegendItem[]): Map<string, string> {
  const map = new Map<string, string>()
  for (const item of legend) map.set(item.hex.toUpperCase(), item.artkalCode)
  return map
}

/** 用豆汇总：总颗数 + 颜色种数 */
export function legendTotals(legend: LegendItem[]): { beads: number; colors: number } {
  return {
    beads: legend.reduce((s, it) => s + it.count, 0),
    colors: legend.length,
  }
}
