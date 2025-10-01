// API utility functions
const API_BASE = import.meta.env.VITE_API_BASE_URL || (import.meta.env.DEV ? 'http://localhost:3000' : '');

// Debug logging
console.log('Environment check:', {
  VITE_API_BASE_URL: import.meta.env.VITE_API_BASE_URL,
  DEV: import.meta.env.DEV,
  API_BASE
});

// Ensure API_BASE doesn't end with a slash
const cleanApiBase = API_BASE.replace(/\/$/, '');

export const getApiUrl = (endpoint: string): string => {
  // Remove leading slash from endpoint if it exists
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  
  // If no API_BASE is set, use relative URL (same domain)
  if (!cleanApiBase) {
    return `/api/${cleanEndpoint}`;
  }
  
  return `${cleanApiBase}/api/${cleanEndpoint}`;
};

export { cleanApiBase as API_BASE };
