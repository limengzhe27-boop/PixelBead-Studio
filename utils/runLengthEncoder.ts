import type { ColorEntry, PixelGrid } from '../types'
import { resolveColor } from '../data/brands'

/**
 * 逐行施工指南（游程编码 RLE）—— PRD/v1.2 功能 7
 * 对每行连续相同颜色合并计数，供编辑器底部浮层与 PDF 第三页使用。
 */
export interface RunSegment {
  hex: string | null
  count: number
  code?: string
  name_cn?: string
}

export function encodeRow(row: (string | null)[], palette?: ColorEntry[]): RunSegment[] {
  const segs: RunSegment[] = []
  for (const cell of row) {
    const last = segs[segs.length - 1]
    if (last && last.hex === cell) {
      last.count++
    } else if (cell) {
      const e = resolveColor(cell, palette)
      segs.push({ hex: cell, count: 1, code: e?.code, name_cn: e?.name_cn })
    } else {
      segs.push({ hex: null, count: 1 })
    }
  }
  return segs
}

export function encodeAllRows(grid: PixelGrid, palette?: ColorEntry[]): RunSegment[][] {
  return grid.map((row) => encodeRow(row, palette))
}

/** 单段文字标签，如 "C13粉色×6" 或 "空×4" */
export function segmentLabel(seg: RunSegment): string {
  if (seg.hex === null) return `空×${seg.count}`
  return `${seg.code ?? ''} ${seg.name_cn ?? ''}×${seg.count}`.trim()
}
