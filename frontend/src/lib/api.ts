// API helper with authentication support
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

// Get auth token from localStorage (persists across page refreshes)
export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  // Try to get from localStorage where login stores it
  const token = localStorage.getItem('token');
  if (token) return token;
  return null;
}

// Helper to make authenticated API calls to Flask backend or Next.js API routes
export async function fetchWithAuth(endpoint: string, options: RequestInit = {}) {
  const token = getAuthToken();

  const headers: Record<string, string> = {
    ...((options.headers as Record<string, string>) || {}),
  };

  // Only set Content-Type for JSON requests, not FormData
  const isFormData = options.body instanceof FormData;
  if (!isFormData && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Detect if this is a Next.js API route (starts with /api but not http)
  // Next.js routes should use relative URL, Flask routes need API_URL prefix
  const isNextRoute = endpoint.startsWith('/api') && !endpoint.startsWith('http');
  const url = isNextRoute ? endpoint : `${API_URL}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    // Token expired or invalid - redirect to login
    if (typeof window !== 'undefined') {
      window.location.href = '/auth/login?redirect=' + encodeURIComponent(window.location.pathname);
    }
    throw new Error('Authentication required');
  }

  return response;
}

// Store auth token (call this after login)
export function setAuthToken(token: string) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('token', token);
  }
}

// Clear auth token (call on logout)
export function clearAuthToken() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('token');
  }
}
