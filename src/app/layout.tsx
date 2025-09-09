import type { Metadata } from 'next'
import { Inter, Playfair_Display, Cormorant_Garamond } from 'next/font/google'
import './globals.css'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { UserProvider } from '@/contexts/UserContext'
import { ScrollToTopProvider } from '@/components/providers/ScrollToTopProvider'
import { ScrollToTopButton } from '@/components/ui/ScrollToTopButton'

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
  preload: true,
})

const playfair = Playfair_Display({ 
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
  preload: true,
})

const cormorant = Cormorant_Garamond({ 
  subsets: ['latin'],
  variable: '--font-cormorant',
  display: 'swap',
  weight: ['400', '600'],
  preload: true,
})

export const metadata: Metadata = {
  title: 'Kobac Real Estate - Premium Real Estate',
  description: 'Discover luxury properties in the most prestigious locations worldwide. Experience premium real estate with Kobac Real Estate.',
  keywords: 'luxury real estate, premium properties, luxury homes, real estate, kobac real estate',
  authors: [{ name: 'Kobac Real Estate' }],
  openGraph: {
    title: 'Kobac Real Estate - Premium Real Estate',
    description: 'Discover luxury properties in the most prestigious locations worldwide.',
    type: 'website',
    locale: 'en_US',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable} ${cormorant.variable}`}>
      <body className="font-sans antialiased bg-white text-primary-900">
        <UserProvider>
          <ScrollToTopProvider>
            <Header />
            <main>
              {children}
            </main>
            <Footer />
            <ScrollToTopButton />
          </ScrollToTopProvider>
        </UserProvider>
      </body>
    </html>
  )
}
