export const apiFetch = async (input: any, init?: any): Promise<Response> => {
  const inputStr = typeof input === 'string' ? input : String(input);
  const isApiRoute = inputStr.startsWith('/api/') || inputStr.includes('/api/');
  
  if (isApiRoute) {
    const apiKey = process.env.NEXT_PUBLIC_API_KEY || '';
    
    const headers = new Headers(init?.headers || {});
    if (apiKey) {
      headers.set('x-api-key', apiKey);
    }
    
    return fetch(input, { ...init, headers });
  }

  return fetch(input, init);
}
