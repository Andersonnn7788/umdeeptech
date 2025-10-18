'use client'

import { useRouter } from 'next/navigation'
import BottomNavigation from '@/components/BottomNavigation'
import Image from 'next/image'

export default function Home() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-blue-50 dark:from-gray-900 dark:via-blue-950 dark:to-gray-900 flex flex-col">
      {/* Header */}
      <header className="w-full px-4 py-4 flex justify-end items-center">
        <button
          onClick={() => router.push('/dermatologist/cases')}
          className="px-4 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-2 border-gray-200 dark:border-gray-600 rounded-lg font-medium text-sm hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-blue-500 dark:hover:border-blue-500 transition-all shadow-sm hover:shadow-md"
        >
          Doctor
        </button>
      </header>

      {/* Main Content - Centered */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 pb-20">
        <div className="w-full max-w-md space-y-2 text-center">
        <div className="flex flex-col items-center justify-center">
  <Image 
    src="/skinlife-logo.png" 
    alt="SkinLife Logo" 
    width={400} 
    height={400}
    priority
    className="w-80 h-80 md:w-[28rem] md:h-[28rem] object-contain"
  />
</div>


          {/* CTA Buttons */}
          <div className="space-y-4">
            <button
              onClick={() => router.push('/skin-analysis')}
              className="w-full px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-2xl font-semibold text-lg shadow-xl hover:shadow-2xl transition-all flex items-center justify-center gap-3 group"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Start Skin Analysis
              <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </button>
            <button
              onClick={() => router.push('/skin-analysis')}
              className="w-full px-8 py-4 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-white border-2 border-gray-200 dark:border-gray-600 rounded-2xl font-semibold text-lg transition-all shadow-md hover:shadow-lg"
            >
              Learn More
            </button>
          </div>
        </div>
      </main>
      
      <BottomNavigation />
    </div >
  )
}
