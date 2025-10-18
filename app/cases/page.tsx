'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import LoadingSpinner from '@/components/LoadingSpinner'
import BottomNavigation from '@/components/BottomNavigation'
import { WithAuth } from '@/components/WithAuth'

interface CaseItem {
  id: string
  status: string
  created_at: string
}

function CasesListInner() {
  const router = useRouter()
  const [cases, setCases] = useState<CaseItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchCases = async () => {
      try {
        const response = await fetch('/api/cases')
        if (!response.ok) throw new Error('Failed to load cases')
        const data = await response.json()
        setCases(data.cases ?? [])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }
    fetchCases()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading cases..." />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800 pb-24">
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold">My Cases</h1>
          <button
            className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
            onClick={() => router.push('/')}
          >
            Home
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 space-y-4">
        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-xl text-sm">
            {error}
          </div>
        )}

        {cases.length === 0 ? (
          <div className="text-center text-gray-600 dark:text-gray-300 p-8 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700">
            No cases yet. Start a Skin Analysis to create one.
            <div className="mt-4">
              <button
                onClick={() => router.push('/skin-analysis')}
                className="px-5 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold"
              >
                Start Skin Analysis
              </button>
            </div>
          </div>
        ) : (
          <div className="grid gap-4">
            {cases.map((c) => (
              <button
                key={c.id}
                onClick={() => router.push(`/cases/${c.id}`)}
                className="text-left p-4 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 hover:shadow-md transition"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold">Case {c.id.slice(0, 8)}...</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Created {new Date(c.created_at).toLocaleString()}
                    </div>
                  </div>
                  <span className="px-3 py-1 text-sm rounded-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                    {c.status}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </main>

      <BottomNavigation />
    </div>
  )
}

export default function CasesPage() {
  return (
    <WithAuth>
      <CasesListInner />
    </WithAuth>
  )
}


