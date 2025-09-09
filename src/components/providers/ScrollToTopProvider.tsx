'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { scrollToTop, scrollToTopInstant, handlePageRefresh } from '@/utils/scrollUtils'

interface ScrollToTopProviderProps {
  children: React.ReactNode
}

export const ScrollToTopProvider = ({ children }: ScrollToTopProviderProps) => {
  const pathname = usePathname()

  useEffect(() => {
    // Scroll to top on route change with smooth animation
    scrollToTop('smooth')
  }, [pathname])

  useEffect(() => {
    // Handle page refresh
    const handleBeforeUnload = () => {
      // Store current scroll position to restore after refresh
      sessionStorage.setItem('scrollPosition', window.scrollY.toString())
    }

    const handleLoad = () => {
      // Handle page refresh scroll behavior
      handlePageRefresh()
    }

    // Add event listeners
    window.addEventListener('beforeunload', handleBeforeUnload)
    window.addEventListener('load', handleLoad)

    // Initial scroll to top
    scrollToTopInstant()

    // Cleanup
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      window.removeEventListener('load', handleLoad)
    }
  }, [])

  return <>{children}</>
}
