// API utility functions
const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

// Ensure API_BASE doesn't end with a slash
const cleanApiBase = API_BASE.replace(/\/$/, '');

export const getApiUrl = (endpoint: string): string => {
  // Remove leading slash from endpoint if it exists
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  return `${cleanApiBase}/${cleanEndpoint}`;
};

export { cleanApiBase as API_BASE };
