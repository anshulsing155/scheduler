/**
 * Uptime Check Script
 * 
 * Simple script to check if the application is running.
 * Can be used with cron jobs or external monitoring services.
 */

const ENDPOINTS = [
  { name: 'Health Check', url: '/api/health' },
  { name: 'Homepage', url: '/' },
];

async function checkEndpoint(baseUrl: string, endpoint: typeof ENDPOINTS[0]) {
  const url = `${baseUrl}${endpoint.url}`;
  const startTime = Date.now();

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'Uptime-Monitor/1.0',
      },
    });

    const duration = Date.now() - startTime;
    const isHealthy = response.ok;

    return {
      name: endpoint.name,
      url,
      status: response.status,
      statusText: response.statusText,
      duration,
      isHealthy,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    const duration = Date.now() - startTime;

    return {
      name: endpoint.name,
      url,
      status: 0,
      statusText: 'Connection Failed',
      duration,
      isHealthy: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    };
  }
}

async function runUptimeCheck(baseUrl: string) {
  console.log(`Running uptime check for: ${baseUrl}`);
  console.log('='.repeat(60));

  const results = await Promise.all(
    ENDPOINTS.map((endpoint) => checkEndpoint(baseUrl, endpoint))
  );

  let allHealthy = true;

  for (const result of results) {
    const statusIcon = result.isHealthy ? '✅' : '❌';
    console.log(`${statusIcon} ${result.name}`);
    console.log(`   URL: ${result.url}`);
    console.log(`   Status: ${result.status} ${result.statusText}`);
    console.log(`   Response Time: ${result.duration}ms`);

    if (!result.isHealthy) {
      allHealthy = false;
      if ('error' in result) {
        console.log(`   Error: ${result.error}`);
      }
    }

    console.log('');
  }

  console.log('='.repeat(60));
  console.log(`Overall Status: ${allHealthy ? '✅ Healthy' : '❌ Unhealthy'}`);

  return allHealthy;
}

// Run if called directly
if (require.main === module) {
  const baseUrl = process.argv[2] || process.env.NEXTAUTH_URL || 'http://localhost:3000';

  runUptimeCheck(baseUrl)
    .then((isHealthy) => {
      process.exit(isHealthy ? 0 : 1);
    })
    .catch((error) => {
      console.error('Uptime check failed:', error);
      process.exit(1);
    });
}

export { runUptimeCheck };
