// API helper with authentication support
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

// Get auth token from sessionStorage (set by login)
export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  // Try to get from sessionStorage where login stores it
  const token = sessionStorage.getItem('token');
  if (token) return token;
  
  // Fallback: try to get from next-auth session if available
  const sessionStr = sessionStorage.getItem('next-auth.session-token');
  if (sessionStr) {
    try {
      const session = JSON.parse(sessionStr);
      return session?.token || null;
    } catch {
      return null;
    }
  }
  return null;
}

// Helper to make authenticated API calls to Flask backend
export async function fetchWithAuth(endpoint: string, options: RequestInit = {}) {
  const token = getAuthToken();
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const response = await fetch(`${API_URL}${endpoint}`, {
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
    sessionStorage.setItem('token', token);
  }
}

// Clear auth token (call on logout)
export function clearAuthToken() {
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem('token');
  }
}
