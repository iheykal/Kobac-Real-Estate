'use client'

import Hero from '@/components/sections/Hero'
import { Button } from '@/components/ui/Button'
import { User } from 'lucide-react'
import { useUser } from '@/contexts/UserContext'
import { useRedirectAnimation } from '@/hooks/useRedirectAnimation'
import RedirectAnimation from '@/components/ui/RedirectAnimation'
import dynamic from 'next/dynamic'

// Lazy load SampleHomes component for better performance
const SampleHomes = dynamic(() => import('@/components/sections/SampleHomes').then(mod => ({ default: mod.SampleHomes })), {
  loading: () => (
    <div className="flex items-center justify-center py-20">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-slate-600">Loading properties...</p>
      </div>
    </div>
  ),
  ssr: false
})

export default function HomePage() {
  const { user, isAuthenticated, isLoading } = useUser()
  const { isAnimating, startRedirect, animationProps } = useRedirectAnimation({
    destination: "Agent Dashboard",
    message: "Taking you to your dashboard..."
  })

  const handleAgentDashboardClick = (e: React.MouseEvent) => {
    e.preventDefault()
    startRedirect('/agent')
  }

  return (
    <div className="min-h-screen">
      {/* Redirect Animation */}
      <RedirectAnimation {...animationProps} />
      
      {/* Agent Dashboard Access Button - Only show when auth is loaded and user is agent */}
      {!isLoading && isAuthenticated && user?.role === 'agent' && (
        <>
          {/* Desktop/Tablet Button - Positioned below header */}
          <div className="hidden sm:block fixed top-20 right-4 z-40">
            <Button 
              onClick={handleAgentDashboardClick}
              variant="secondary" 
              size="sm"
              className="bg-white/90 backdrop-blur-sm text-blue-600 hover:bg-white shadow-lg border border-blue-200 font-semibold transition-all duration-300 hover:scale-105 active:scale-95"
            >
              <User className="w-4 h-4 mr-2" />
              Agent Dashboard
            </Button>
          </div>
          
          {/* Mobile Floating Action Button */}
          <div className="sm:hidden fixed bottom-6 right-6 z-50 relative">
            <Button 
              onClick={handleAgentDashboardClick}
              variant="secondary" 
              size="lg"
              className="bg-blue-600 hover:bg-blue-700 text-white shadow-2xl border-0 font-semibold w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95"
            >
              <User className="w-6 h-6" />
            </Button>
            <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full font-bold shadow-lg">
              Agent
            </div>
          </div>
        </>
      )}


      <Hero />
      <SampleHomes />
      

      
      

    </div>
  )
}
