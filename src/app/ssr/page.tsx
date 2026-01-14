import { PageLayout, DemoLayout, DataDisplay } from '@/components/layout'

// Force dynamic rendering - disable static optimization
export const dynamic = 'force-dynamic'

// Test Fetch Proxy functionality and error handling
async function getSSRData() {
  interface FetchTestResult {
    test: string
    status: string
    statusCode?: number
    proxyUsed?: string
    error?: string
    data?: string
  }

  const results = {
    requestTime: new Date().toISOString(),
    serverTime: new Date().toISOString(),
    dataFetchTime: new Date().toISOString(),
    realtimeValue: Math.floor(Math.random() * 1000),
    timestamp: Date.now(),
    serverHash: Math.random().toString(36).substring(7),
    fetchTests: [] as FetchTestResult[]
  }

  // Test 1: Normal successful fetch (should use proxy if needed)
  try {
    const response = await fetch('https://httpbin.org/json', {
      method: 'GET',
      headers: {
        'User-Agent': 'NextJS-SSR-Test'
      }
    })
    
    if (response.ok) {
      const data = await response.json()
      results.fetchTests.push({
        test: 'Normal Fetch',
        status: 'SUCCESS',
        statusCode: response.status,
        proxyUsed: response.headers.get('oe-proxy-used') || 'unknown',
        data: JSON.stringify(data).substring(0, 100) + '...'
      })
    } else {
      results.fetchTests.push({
        test: 'Normal Fetch',
        status: 'HTTP_ERROR',
        statusCode: response.status,
        error: `HTTP ${response.status}`
      })
    }
  } catch (error: unknown) {
    results.fetchTests.push({
      test: 'Normal Fetch',
      status: 'NETWORK_ERROR',
      error: error instanceof Error ? error.message : String(error)
    })
  }

  // Test 2: Fetch with timeout (should trigger proxy fallback)
  try {
    const response = await fetch('https://httpbin.org/delay/2', {
      method: 'GET',
      headers: {
        'User-Agent': 'NextJS-SSR-Timeout-Test'
      }
    })
    
    if (response.ok) {
      await response.json() // Consume response body
      results.fetchTests.push({
        test: 'Timeout Test',
        status: 'SUCCESS',
        statusCode: response.status,
        proxyUsed: response.headers.get('oe-proxy-used') || 'likely_proxy',
        data: 'Delayed response received'
      })
    } else {
      results.fetchTests.push({
        test: 'Timeout Test',
        status: 'HTTP_ERROR',
        statusCode: response.status,
        error: `HTTP ${response.status}`
      })
    }
  } catch (error: unknown) {
    results.fetchTests.push({
      test: 'Timeout Test',
      status: 'NETWORK_ERROR',
      error: error instanceof Error ? error.message : String(error),
      proxyUsed: 'likely_proxy'
    })
  }

  // Test 3: Fetch to non-existent domain (should use proxy)
  try {
    const response = await fetch('https://non-existent-domain-12345.com/api/test', {
      method: 'GET'
    })
    
    results.fetchTests.push({
      test: 'Non-existent Domain',
      status: 'UNEXPECTED_SUCCESS',
      statusCode: response.status,
      proxyUsed: 'definitely_proxy'
    })
  } catch (error: unknown) {
    results.fetchTests.push({
      test: 'Non-existent Domain',
      status: 'EXPECTED_ERROR',
      error: error instanceof Error ? error.message : String(error),
      proxyUsed: 'proxy_attempted'
    })
  }

  // Test 4: POST request with body
  try {
    const response = await fetch('https://httpbin.org/post', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'NextJS-SSR-POST-Test'
      },
      body: JSON.stringify({
        test: 'SSR Fetch Proxy Test',
        timestamp: Date.now(),
        source: 'NextJS SSR Page'
      })
    })
    
    if (response.ok) {
      const responseData = await response.json()
      results.fetchTests.push({
        test: 'POST Request',
        status: 'SUCCESS',
        statusCode: response.status,
        proxyUsed: response.headers.get('oe-proxy-used') || 'unknown',
        data: `Received: ${responseData.json?.test || 'POST data'}`
      })
    } else {
      results.fetchTests.push({
        test: 'POST Request',
        status: 'HTTP_ERROR',
        statusCode: response.status,
        error: `HTTP ${response.status}`
      })
    }
  } catch (error: unknown) {
    results.fetchTests.push({
      test: 'POST Request',
      status: 'NETWORK_ERROR',
      error: error instanceof Error ? error.message : String(error)
    })
  }

  return results
}

// This page demonstrates Server-Side Rendering with Fetch Proxy Testing
export default async function SSRPage() {
  // This function is executed every time a request is made
  const data = await getSSRData()

  const codeExample = `// app/ssr/page.tsx - Fetch Proxy Testing
export const dynamic = 'force-dynamic'

export default async function SSRPage() {
  // Test 1: Normal fetch (may use proxy if connection fails)
  const response1 = await fetch('https://httpbin.org/json')
  
  // Test 2: Timeout scenario (should trigger proxy fallback)
  const response2 = await fetch('https://httpbin.org/delay/2')
  
  // Test 3: Non-existent domain (proxy will attempt)
  const response3 = await fetch('https://non-existent-domain.com/api')
  
  // Test 4: POST with body (proxy should preserve body)
  const response4 = await fetch('https://httpbin.org/post', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ test: 'proxy test' })
  })
  
  return <div>Fetch Proxy Test Results</div>
}`

  const ssrData = [
    { label: 'Request Time', value: data.requestTime, color: 'text-green-400' },
    { label: 'Server Time', value: data.serverTime, color: 'text-blue-400' },
    { label: 'Real-time Value', value: data.realtimeValue, color: 'text-purple-400' },
    { label: 'Server Hash', value: data.serverHash, color: 'text-indigo-400' },
    { label: 'Fetch Tests Count', value: data.fetchTests.length, color: 'text-yellow-400' }
  ]

  const ssrFeatures = [
    { title: 'Fetch Proxy Detection', description: 'Tests if fetch requests use proxy when direct connection fails' },
    { title: 'Error Handling', description: 'Validates proper error handling for network failures' },
    { title: 'Timeout Fallback', description: 'Tests proxy fallback when requests timeout' },
    { title: 'Body Preservation', description: 'Ensures POST request bodies are preserved through proxy' }
  ]

  return (
    <PageLayout>
      <DemoLayout
        title="SSR + Fetch Proxy Test"
        subtitle="Server-side rendering with fetch proxy functionality testing and error handling validation."
        description="This page tests the Fetch Proxy functionality by making various HTTP requests and observing proxy behavior, timeout handling, and error responses."
        codeExample={codeExample}
        renderMode="SSR"
        dataDisplay={
          <div className="space-y-6">
            <DataDisplay
              title="SSR: Server-Side Rendering + Fetch Proxy"
              description="Real-time fetch proxy testing with various scenarios"
              data={ssrData}
              features={ssrFeatures}
            />
            
            {/* Fetch Test Results */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-xl font-semibold text-white mb-4">Fetch Proxy Test Results</h3>
              <div className="space-y-4">
                {data.fetchTests.map((test, index) => (
                  <div key={index} className="border border-gray-600 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="text-lg font-medium text-white">{test.test}</h4>
                      <span className={`px-2 py-1 rounded text-sm font-medium ${
                        test.status === 'SUCCESS' ? 'bg-green-600 text-white' :
                        test.status === 'EXPECTED_ERROR' ? 'bg-yellow-600 text-white' :
                        test.status === 'NETWORK_ERROR' ? 'bg-red-600 text-white' :
                        test.status === 'HTTP_ERROR' ? 'bg-orange-600 text-white' :
                        'bg-gray-600 text-white'
                      }`}>
                        {test.status}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                      {test.statusCode && (
                        <div className="text-gray-300">
                          <span className="font-medium">Status Code:</span> {test.statusCode}
                        </div>
                      )}
                      {test.proxyUsed && (
                        <div className="text-gray-300">
                          <span className="font-medium">Proxy Used:</span> {test.proxyUsed}
                        </div>
                      )}
                      {test.error && (
                        <div className="text-red-400 col-span-full">
                          <span className="font-medium">Error:</span> {test.error}
                        </div>
                      )}
                      {test.data && (
                        <div className="text-green-400 col-span-full">
                          <span className="font-medium">Data:</span> {test.data}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        }
      />
    </PageLayout>
  )
} 