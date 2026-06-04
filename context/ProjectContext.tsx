'use client'

import { createContext, useContext, useMemo, useReducer, type ReactNode, type Dispatch } from 'react'
import { initialState, type ProjectState } from '../types'
import { projectReducer, type ProjectAction } from '../reducers/projectReducer'

/**
 * 全局状态容器（PRD §6）：React Context + useReducer
 * 无后端、无 localStorage，所有状态存活在内存中（刷新即清空）。
 * ProjectProvider 包裹整个应用，三个页面通过 useProject() 读取与更新。
 */

interface ProjectContextValue {
  state: ProjectState
  dispatch: Dispatch<ProjectAction>
  /** 是否可撤销 */
  canUndo: boolean
  /** 是否可重做 */
  canRedo: boolean
}

const ProjectContext = createContext<ProjectContextValue | null>(null)

export function ProjectProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(projectReducer, initialState)

  const value = useMemo<ProjectContextValue>(
    () => ({
      state,
      dispatch,
      canUndo: state.historyIndex > 0,
      canRedo: state.historyIndex < state.history.length - 1,
    }),
    [state],
  )

  return <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useProject(): ProjectContextValue {
  const ctx = useContext(ProjectContext)
  if (!ctx) {
    throw new Error('useProject 必须在 <ProjectProvider> 内部使用')
  }
  return ctx
}
