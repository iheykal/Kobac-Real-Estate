'use client'

export default function TestAdmin() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Admin Test Page</h1>
      <p>If you can see this, the admin route is working.</p>
      <div className="mt-4">
        <a href="/admin" className="text-blue-600 hover:underline">
          Go to actual admin page
        </a>
      </div>
    </div>
  )
}
