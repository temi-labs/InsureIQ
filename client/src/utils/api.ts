let API_URL = import.meta.env.VITE_API_URL || '';

// Auto-correct port 300 to 3000 in case of an environment config typo
if (API_URL.endsWith(':300')) {
  API_URL += '0';
}

// If we are running in the AI Studio cloud preview environment, the API is always running
// on the same origin (same server). Hardcoded local IPs in .env will break mobile testing.
if (typeof window !== 'undefined' && window.location.hostname.includes('run.app')) {
  API_URL = '';
}

// Prevent mixed content errors if somehow HTTPS frontend tries to call HTTP API
if (typeof window !== 'undefined' && window.location.protocol === 'https:' && API_URL.startsWith('http://')) {
  API_URL = '';
}

export async function apiFetch(endpoint: string, options: RequestInit = {}) {
  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  
  // Use relative path only if API_URL is still empty.
  // Actually, explicitly setting it to location.origin is safer for mobile browsers.
  let baseUrl = API_URL;
  if (typeof window !== 'undefined') {
    // If we're on mobile/LAN but VITE_API_URL says localhost, override it to use the LAN IP.
    if (baseUrl.includes('localhost') || baseUrl.includes('127.0.0.1')) {
       baseUrl = baseUrl.replace('localhost', window.location.hostname).replace('127.0.0.1', window.location.hostname);
    }
    if (!baseUrl) {
      baseUrl = window.location.origin;
    }
  }
  
  const url = `${baseUrl}${path}`;
  
  const method = options.method || 'GET';
  
  console.log(`[API Request] ${method} ${url}`);
  if (options.body) {
    try {
      console.log(`[API Payload]`, JSON.parse(options.body as string));
    } catch {
      console.log(`[API Payload]`, options.body);
    }
  }

  try {
    const response = await fetch(url, options);
    if (!response.ok) {
      console.error(`[API Error] ${method} ${url} returned ${response.status}`);
    } else {
      console.log(`[API Success] ${method} ${url} returned ${response.status}`);
    }
    return response;
  } catch (err) {
    console.error(`[API Failed] ${method} ${url}`, err);
    throw err;
  }
}
