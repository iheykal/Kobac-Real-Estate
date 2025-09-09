'use client'

import dynamic from 'next/dynamic'
import { ComponentType } from 'react'

// Lazy load chart components to reduce initial bundle size
export const LazyPieChart = dynamic(
  () => import('@/components/charts/PieChart'),
  { 
    ssr: false,
    loading: () => <div className="w-full h-64 bg-gray-100 animate-pulse rounded-lg" />
  }
) as ComponentType<any>

export const LazyBarChart = dynamic(
  () => import('@/components/charts/BarChart'),
  { 
    ssr: false,
    loading: () => <div className="w-full h-64 bg-gray-100 animate-pulse rounded-lg" />
  }
) as ComponentType<any>

export const LazyLineChart = dynamic(
  () => import('@/components/charts/LineChart'),
  { 
    ssr: false,
    loading: () => <div className="w-full h-64 bg-gray-100 animate-pulse rounded-lg" />
  }
) as ComponentType<any>

export const LazyAreaChart = dynamic(
  () => import('@/components/charts/AreaChart'),
  { 
    ssr: false,
    loading: () => <div className="w-full h-64 bg-gray-100 animate-pulse rounded-lg" />
  }
) as ComponentType<any>
