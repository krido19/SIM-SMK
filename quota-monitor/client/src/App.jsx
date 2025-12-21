import { useState, useEffect } from 'react'

function App() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchData = async () => {
    try {
      setLoading(true)
      const res = await fetch('http://localhost:3001/api/quota')
      const json = await res.json()

      if (!res.ok) throw new Error(json.error || 'Failed to fetch')

      setData(json.data)
      setError(null)
    } catch (err) {
      setError(err.message)
      // Fallback for demo if API fails (Optional, but good for UI dev)
      // setData(MOCK_DATA) 
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 30000) // Refresh every 30s
    return () => clearInterval(interval)
  }, [])

  if (loading && !data) return <div className="flex items-center justify-center h-screen bg-antigravity-bg">Loading Antigravity data...</div>

  return (
    <div className="min-h-screen bg-antigravity-bg text-gray-100 p-8 font-sans">
      <div className="max-w-4xl mx-auto">
        <header className="flex justify-between items-center mb-10">
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
            Antigravity Quota
          </h1>
          <div className="text-sm text-gray-400">
            Resets Weekly
          </div>
        </header>

        {error && (
          <div className="bg-red-900/30 border border-red-500/50 p-4 rounded-lg mb-6 text-red-200">
            {error}
            <button onClick={fetchData} className="ml-4 underline hover:text-white">Retry</button>
          </div>
        )}

        {data && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Main Quota Card */}
            <div className="bg-antigravity-card p-6 rounded-2xl border border-gray-700 shadow-xl">
              <h2 className="text-xl font-semibold mb-4 text-blue-300">Agent Usage</h2>

              {/* Progress Circle could go here */}
              <div className="relative pt-1">
                <div className="flex mb-2 items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-blue-600 bg-blue-200">
                      Work Done
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-semibold inline-block text-blue-600">
                      {data.usagePercentage || 0}%
                    </span>
                  </div>
                </div>
                <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-gray-700">
                  <div style={{ width: `${data.usagePercentage || 0}%` }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-500 transition-all duration-500"></div>
                </div>
              </div>
            </div>

            {/* Details Card */}
            <div className="bg-antigravity-card p-6 rounded-2xl border border-gray-700 shadow-xl">
              <h2 className="text-xl font-semibold mb-4 text-purple-300">Status Details</h2>
              <ul className="space-y-3 text-sm">
                <li className="flex justify-between border-b border-gray-700 pb-2">
                  <span>Status</span>
                  <span className="font-mono text-green-400">{data.status || 'Active'}</span>
                </li>
                <li className="flex justify-between border-b border-gray-700 pb-2">
                  <span>Tier</span>
                  <span className="font-mono">{data.tier || 'Public Preview'}</span>
                </li>
              </ul>
            </div>
          </div>
        )}

        {!data && !error && (
          <div className="text-center text-gray-500 mt-20">
            Waiting for connection...
          </div>
        )}
      </div>
    </div>
  )
}

export default App
