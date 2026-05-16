'use client'

import { Button } from '@/components/ui/button'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-100 px-4">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-900 mb-4">500</h1>
        <p className="text-2xl text-gray-600 mb-8">Something went wrong</p>
        <p className="text-gray-500 mb-8 max-w-md">
          An error occurred while processing your request. Please try again.
        </p>
        <div className="space-x-4">
          <Button
            onClick={() => reset()}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Try Again
          </Button>
          <Button variant="outline">
            Go Home
          </Button>
        </div>
      </div>
    </div>
  )
}
