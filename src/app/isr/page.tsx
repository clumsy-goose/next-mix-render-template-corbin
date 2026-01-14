import { PageLayout, DemoLayout, DataDisplay } from '@/components/layout'

// Configure ISR to revalidate every 10 seconds
export const revalidate = 10

// Test Fetch Proxy functionality with ISR caching
async function getISRData() {
  interface FetchTestResult {
    test: string
    status: string
    statusCode?: number
    proxyUsed?: string
    error?: string
    data?: string
    cacheInfo?: string
  }

  const results = {
    buildTime: new Date().toISOString(),
    cacheStatus: 'cached for 10 seconds',
    fetchTests: [] as FetchTestResult[]
  }

  // Test 1: Cached fetch with ISR (should respect cache but test proxy on cache miss)
  try {
    const response = await fetch('https://httpbin.org/uuid', {
      next: { revalidate: 10 } // Same as page revalidation
    })
    
    if (response.ok) {
      const responseData = await response.json()
      results.fetchTests.push({
        test: 'ISR Cached Fetch',
        status: 'SUCCESS',
        statusCode: response.status,
        proxyUsed: response.headers.get('oe-proxy-used') || 'unknown',
        data: responseData.uuid,
        cacheInfo: 'Cached with ISR revalidation'
      })
    } else {
      results.fetchTests.push({
        test: 'ISR Cached Fetch',
        status: 'HTTP_ERROR',
        statusCode: response.status,
        error: `HTTP ${response.status}`
      })
    }
  } catch (error: unknown) {
    results.fetchTests.push({
      test: 'ISR Cached Fetch',
      status: 'NETWORK_ERROR',
      error: error instanceof Error ? error.message : String(error),
      proxyUsed: 'likely_proxy'
    })
  }

  // Test 2: No-cache fetch (should always test proxy behavior)
  try {
    const response = await fetch('https://httpbin.org/ip', {
      cache: 'no-store' // Force fresh request
    })
    
    if (response.ok) {
      const responseData = await response.json()
      results.fetchTests.push({
        test: 'No-Cache Fetch',
        status: 'SUCCESS',
        statusCode: response.status,
        proxyUsed: response.headers.get('oe-proxy-used') || 'unknown',
        data: responseData.origin,
        cacheInfo: 'No cache - fresh request'
      })
    } else {
      results.fetchTests.push({
        test: 'No-Cache Fetch',
        status: 'HTTP_ERROR',
        statusCode: response.status,
        error: `HTTP ${response.status}`
      })
    }
  } catch (error: unknown) {
    results.fetchTests.push({
      test: 'No-Cache Fetch',
      status: 'NETWORK_ERROR',
      error: error instanceof Error ? error.message : String(error),
      proxyUsed: 'likely_proxy'
    })
  }

  // Test 3: Slow endpoint (should trigger proxy fallback)
  try {
    const response = await fetch('https://httpbin.org/delay/1', {
      next: { revalidate: 10 }
    })
    
    if (response.ok) {
      await response.json() // Consume response body
      results.fetchTests.push({
        test: 'Slow Endpoint',
        status: 'SUCCESS',
        statusCode: response.status,
        proxyUsed: response.headers.get('oe-proxy-used') || 'likely_proxy',
        data: 'Delayed response received',
        cacheInfo: 'Cached after successful proxy request'
      })
    } else {
      results.fetchTests.push({
        test: 'Slow Endpoint',
        status: 'HTTP_ERROR',
        statusCode: response.status,
        error: `HTTP ${response.status}`
      })
    }
  } catch (error: unknown) {
    results.fetchTests.push({
      test: 'Slow Endpoint',
      status: 'NETWORK_ERROR',
      error: error instanceof Error ? error.message : String(error),
      proxyUsed: 'proxy_attempted'
    })
  }

  // Test 4: Error endpoint (test error handling with caching)
  try {
    const response = await fetch('https://httpbin.org/status/500', {
      next: { revalidate: 5 } // Shorter cache for error testing
    })
    
    results.fetchTests.push({
      test: 'Error Endpoint',
      status: 'HTTP_ERROR',
      statusCode: response.status,
      proxyUsed: response.headers.get('oe-proxy-used') || 'unknown',
      error: `Server returned ${response.status}`,
      cacheInfo: 'Error responses may not be cached'
    })
  } catch (error: unknown) {
    results.fetchTests.push({
      test: 'Error Endpoint',
      status: 'NETWORK_ERROR',
      error: error instanceof Error ? error.message : String(error),
      proxyUsed: 'proxy_attempted'
    })
  }

  return results
}

// This page demonstrates Incremental Static Regeneration with Fetch Proxy Testing
export default async function ISRPage() {
  const data = await getISRData()

  const codeExample = `// app/isr/page.tsx - ISR + Fetch Proxy Testing
export const revalidate = 10 // page-level revalidation

export default async function ISRPage() {
  // Test 1: ISR cached fetch (respects cache, tests proxy on miss)
  const response1 = await fetch('https://httpbin.org/uuid', {
    next: { revalidate: 10 } // Same as page revalidation
  })
  
  // Test 2: No-cache fetch (always fresh, tests proxy)
  const response2 = await fetch('https://httpbin.org/ip', {
    cache: 'no-store' // Force fresh request
  })
  
  // Test 3: Slow endpoint (proxy fallback with caching)
  const response3 = await fetch('https://httpbin.org/delay/1', {
    next: { revalidate: 10 }
  })
  
  // Test 4: Error handling with ISR
  const response4 = await fetch('https://httpbin.org/status/500', {
    next: { revalidate: 5 }
  })
  
  return <div>ISR + Fetch Proxy Test Results</div>
}`

  const isrData = [
    { label: 'Page Build Time', value: data.buildTime, color: 'text-blue-400' },
    { label: 'Cache Status', value: data.cacheStatus, color: 'text-green-400' },
    { label: 'Fetch Tests Count', value: data.fetchTests.length, color: 'text-yellow-400' }
  ]

  const isrFeatures = [
    { title: 'ISR + Proxy Integration', description: 'Tests how fetch proxy works with ISR caching mechanisms' },
    { title: 'Cache Miss Handling', description: 'Validates proxy behavior when ISR cache expires' },
    { title: 'Error Caching', description: 'Tests whether error responses are cached in ISR' },
    { title: 'Revalidation Timing', description: 'Ensures proxy requests respect ISR revalidation intervals' }
  ]

  return (
    <PageLayout>
      <DemoLayout
        title="ISR + Fetch Proxy Test"
        subtitle="Static generation with timed updates, enhanced with fetch proxy functionality testing."
        description="This page combines ISR caching with fetch proxy testing to validate how proxy behavior interacts with Next.js caching mechanisms and revalidation strategies."
        codeExample={codeExample}
        renderMode="ISR"
        dataDisplay={
          <div className="space-y-6">
            <DataDisplay
              title="ISR: Incremental Static Regeneration + Fetch Proxy"
              description="ISR caching behavior combined with fetch proxy testing"
              data={isrData}
              features={isrFeatures}
            />
            
            {/* Fetch Test Results */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-xl font-semibold text-white mb-4">ISR + Fetch Proxy Test Results</h3>
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
                      {test.cacheInfo && (
                        <div className="text-blue-400">
                          <span className="font-medium">Cache Info:</span> {test.cacheInfo}
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
              
              <div className="mt-4 p-4 bg-gray-700 rounded-lg">
                <h4 className="text-lg font-medium text-white mb-2">ISR Behavior Notes</h4>
                <ul className="text-sm text-gray-300 space-y-1">
                  <li>• <strong>Development:</strong> ISR revalidates on every request for debugging</li>
                  <li>• <strong>Production:</strong> True caching behavior with 10-second intervals</li>
                  <li>• <strong>Proxy Integration:</strong> Fetch proxy works seamlessly with ISR caching</li>
                  <li>• <strong>Error Handling:</strong> Network errors may trigger proxy fallback even with cache</li>
                </ul>
              </div>
            </div>
          </div>
        }
      />
    </PageLayout>
  )
} 