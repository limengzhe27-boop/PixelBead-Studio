'use client'

import { useEffect, useState } from 'react'

/** 监听媒体查询；SSR/首帧返回 false，挂载后校正（编辑器为纯客户端，无水合问题）。 */
export function useMediaQuery(query: string): boolean {
  const [match, setMatch] = useState(false)
  useEffect(() => {
    const mql = window.matchMedia(query)
    const onChange = () => setMatch(mql.matches)
    onChange()
    mql.addEventListener('change', onChange)
    return () => mql.removeEventListener('change', onChange)
  }, [query])
  return match
}

/** 断点：与 Tailwind 一致（md=768, lg=1024）。 */
export const useIsMobile = () => useMediaQuery('(max-width: 767px)')
export const useIsTablet = () => useMediaQuery('(min-width: 768px) and (max-width: 1023px)')
export const useIsDesktop = () => useMediaQuery('(min-width: 1024px)')
