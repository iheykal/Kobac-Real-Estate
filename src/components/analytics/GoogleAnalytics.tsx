'use client'

import { useEffect } from 'react'
import Script from 'next/script'

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

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${gaId}');
        `}
      </Script>
    </>
  )
}
