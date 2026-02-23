export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">LeanReserve</h1>
        <p className="text-gray-400">Headless restaurant booking engine</p>
        <div className="mt-8 space-x-4">
          <a 
            href="/book" 
            className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
          >
            Make a Booking
          </a>
          <a 
            href="/dashboard" 
            className="inline-block px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
          >
            Staff Dashboard
          </a>
        </div>
      </div>
    </main>
  )
}