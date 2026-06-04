/**
 * PixelBead Studio —— 全局类型定义
 * 对应 PRD 第六节（状态管理）与第七节（数据结构）
 */

/** 像素网格：每格为 Artkal hex 颜色字符串，或 null（空白格 / 透明） */
export type PixelGrid = (string | null)[][]

/** Artkal 色号条目（PRD §7） */
export interface ColorEntry {
  code: string // Artkal 色号，如 "C08"
  name_cn: string // 中文名，如 "珊瑚红"
  name_en: string // 英文名，如 "Coral"
  hex: string // hex 颜色值，如 "#FF5252"
}

/** 图例条目，由 buildLegend() 生成（PRD §7） */
export interface LegendItem {
  index: number // 显示序号（1, 2, 3...）
  hex: string // hex 颜色值
  artkalCode: string // Artkal 色号
  name_cn: string // 中文颜色名
  name_en: string // 英文颜色名
  count: number // 使用数量（颗）
  percentage: number // 占总用量百分比（保留一位小数）
}

/** 当前流程阶段，控制页面路由保护（PRD §6.3 / §6.5） */
export type ProjectPhase = 'idle' | 'converting' | 'editing'

/** 全局项目状态（PRD §6.3） */
export interface ProjectState {
  /** 原始图片（base64 data URL），用于重新转换时的数据源 */
  sourceImage: string | null

  /** 转换参数 */
  cols: number // 宽度格数，默认 32
  rows: number // 高度格数，随比例联动
  colorCount: number // 颜色数量，默认 12
  lockAspect: boolean // 是否锁定宽高比（默认开启）

  /** 当前像素数据（编辑器操作的核心数据） */
  pixels: PixelGrid | null

  /** 编辑历史（最多保留 50 个快照） */
  history: PixelGrid[]
  historyIndex: number // 当前所在历史位置，-1 表示无历史

  /** 当前阶段（控制页面路由保护） */
  phase: ProjectPhase
}

export const HISTORY_LIMIT = 50

export const initialState: ProjectState = {
  sourceImage: null,
  cols: 32,
  rows: 32,
  colorCount: 12,
  lockAspect: true,
  pixels: null,
  history: [],
  historyIndex: -1,
  phase: 'idle',
}

/** 编辑器工具类型（PRD §F4 + 魔法橡皮） */
export type ToolType = 'brush' | 'eraser' | 'bucket' | 'eyedropper' | 'magicEraser' | 'hand'
