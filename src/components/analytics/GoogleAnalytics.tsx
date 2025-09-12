'use client'

import { GoogleAnalytics } from '@next/third-parties/google'
import { useEffect } from 'react'

interface GoogleAnalyticsProps {
  gaId: string
}

export default function GoogleAnalyticsComponent({ gaId }: GoogleAnalyticsProps) {
  useEffect(() => {
    // Log for debugging purposes
    if (process.env.NODE_ENV === 'development') {
      console.log('Google Analytics initialized with ID:', gaId)
    }
  }, [gaId])

  if (!gaId) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('Google Analytics ID not provided')
    }
    return null
  }

  return <GoogleAnalytics gaId={gaId} />
}
