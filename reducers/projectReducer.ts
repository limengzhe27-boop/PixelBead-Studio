import { initialState, type PixelGrid, type ProjectState } from '../types'

/** 撤销栈上限随图纸尺寸调整：大图（最长边 >150）占内存多，降到 20 步，否则 50 步 */
function limitFor(pixels: PixelGrid): number {
  const longest = Math.max(pixels.length, pixels[0]?.length ?? 0)
  return longest > 150 ? 20 : 50
}

/**
 * 项目状态 Reducer（PRD §6.4）
 *
 * 两类「提交」语义务必区分：
 * - COMMIT_GRID：转换完成 / AI 生成完成，进入编辑器，建立全新的历史基线
 * - COMMIT_EDIT：编辑器内画笔操作 mouseup 时提交一步，进入撤销/重做历史栈
 */
export type ProjectAction =
  | { type: 'SET_SOURCE_IMAGE'; payload: string }
  | { type: 'SET_DIMENSIONS'; payload: { cols: number; rows: number } }
  | { type: 'SET_COLOR_COUNT'; payload: number }
  | { type: 'SET_LOCK_ASPECT'; payload: boolean }
  | { type: 'COMMIT_GRID'; payload: PixelGrid } // 转换 / AI 完成，进入编辑器
  | { type: 'COMMIT_EDIT'; payload: PixelGrid } // 画笔操作 mouseup 时提交
  | { type: 'REPLACE_COLOR'; payload: { from: string; to: string } } // 色号替换：全图批量
  | { type: 'SET_TRANSFORM'; payload: { pixels: PixelGrid; cols: number; rows: number } } // 翻转 / 旋转
  | { type: 'UNDO' }
  | { type: 'REDO' }
  | { type: 'RESET' } // 返回首页，清空所有状态

export function projectReducer(state: ProjectState, action: ProjectAction): ProjectState {
  switch (action.type) {
    case 'SET_SOURCE_IMAGE':
      // 新图片：清空旧的像素与历史，进入转换阶段
      return {
        ...state,
        sourceImage: action.payload,
        pixels: null,
        history: [],
        historyIndex: -1,
        phase: 'converting',
      }

    case 'SET_DIMENSIONS':
      return { ...state, cols: action.payload.cols, rows: action.payload.rows }

    case 'SET_COLOR_COUNT':
      return { ...state, colorCount: action.payload }

    case 'SET_LOCK_ASPECT':
      return { ...state, lockAspect: action.payload }

    case 'COMMIT_GRID':
      // 进入编辑器：以这张图纸作为历史基线（第 0 步）
      return {
        ...state,
        pixels: action.payload,
        history: [action.payload],
        historyIndex: 0,
        phase: 'editing',
      }

    case 'COMMIT_EDIT': {
      // 1. 截断 history 到 historyIndex+1（丢弃 redo 分支）
      const truncated = state.history.slice(0, state.historyIndex + 1)
      // 2. push 新快照
      truncated.push(action.payload)
      let history = truncated
      let historyIndex = history.length - 1
      // 3. 超过上限则移除最旧的若干条（上限随图纸尺寸）
      const limit = limitFor(action.payload)
      if (history.length > limit) {
        history = history.slice(history.length - limit)
        historyIndex = history.length - 1
      }
      // 4 & 5. 更新 historyIndex 与 pixels
      return { ...state, pixels: action.payload, history, historyIndex }
    }

    case 'REPLACE_COLOR': {
      if (!state.pixels) return state
      const f = action.payload.from.toUpperCase()
      const next = state.pixels.map((row) => row.map((c) => (c && c.toUpperCase() === f ? action.payload.to : c)))
      const truncated = state.history.slice(0, state.historyIndex + 1)
      truncated.push(next)
      let history = truncated
      let historyIndex = history.length - 1
      const limit = limitFor(next)
      if (history.length > limit) {
        history = history.slice(history.length - limit)
        historyIndex = history.length - 1
      }
      return { ...state, pixels: next, history, historyIndex }
    }

    case 'SET_TRANSFORM': {
      const truncated = state.history.slice(0, state.historyIndex + 1)
      truncated.push(action.payload.pixels)
      let history = truncated
      let historyIndex = history.length - 1
      const limit = limitFor(action.payload.pixels)
      if (history.length > limit) {
        history = history.slice(history.length - limit)
        historyIndex = history.length - 1
      }
      return {
        ...state,
        pixels: action.payload.pixels,
        cols: action.payload.cols,
        rows: action.payload.rows,
        history,
        historyIndex,
      }
    }

    case 'UNDO': {
      if (state.historyIndex > 0) {
        const idx = state.historyIndex - 1
        return { ...state, historyIndex: idx, pixels: state.history[idx] }
      }
      return state
    }

    case 'REDO': {
      if (state.historyIndex < state.history.length - 1) {
        const idx = state.historyIndex + 1
        return { ...state, historyIndex: idx, pixels: state.history[idx] }
      }
      return state
    }

    case 'RESET':
      return { ...initialState }

    default:
      return state
  }
}
