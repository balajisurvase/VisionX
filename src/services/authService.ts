import { OfficerUser, AuthState } from '../types/auth';

const AUTH_STORAGE_KEY = 'SSB_OFFICER_AUTH_SESSION';
const AUTH_TOKEN_KEY = 'SSB_OFFICER_JWT_TOKEN';

export async function loginWithUserId(
  userId: string,
  password: string,
  rememberMe: boolean = true
): Promise<{ success: boolean; user?: OfficerUser; error?: string }> {
  const cleanUserId = userId.trim();
  const cleanPassword = password.trim();

  if (!cleanUserId || !cleanPassword) {
    return { success: false, error: 'User ID and Password are required.' };
  }

  // 1. Authenticate via FastAPI backend /api/auth/login against database
  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: cleanUserId, password: cleanPassword }),
    });

    if (res.ok) {
      const data = await res.json();
      const token = data.access_token;
      if (token) {
        localStorage.setItem(AUTH_TOKEN_KEY, token);
      }
      const user: OfficerUser = {
        id: 1,
        user_id: data.user.user_id,
        full_name: data.user.full_name,
        role: data.user.role || 'Officer',
        department: data.user.department || 'Sashastra Seema Bal (SSB), Police II Division',
        designation: data.user.designation || 'Screening Officer',
        badge_number: 'SSB-MHA-8842',
        terminal: data.user.terminal || 'ICP Raxaul • Indo-Nepal Border Terminal',
        status: data.user.status || 'Active',
        created_at: new Date().toISOString(),
      };
      saveSession(user, rememberMe);
      return { success: true, user };
    } else {
      const err = await res.json().catch(() => ({ detail: 'Invalid credentials' }));
      return { success: false, error: err.detail || 'Invalid User ID or Password' };
    }
  } catch (apiErr) {
    return {
      success: false,
      error: 'Backend authentication server unreachable. Ensure API is running.',
    };
  }
}

export function saveSession(user: OfficerUser, rememberMe: boolean) {
  const payload = JSON.stringify({ user, rememberMe });
  if (rememberMe) {
    localStorage.setItem(AUTH_STORAGE_KEY, payload);
    sessionStorage.removeItem(AUTH_STORAGE_KEY);
  } else {
    sessionStorage.setItem(AUTH_STORAGE_KEY, payload);
    localStorage.removeItem(AUTH_STORAGE_KEY);
  }
}

export function getCurrentSession(): AuthState {
  try {
    const stored =
      sessionStorage.getItem(AUTH_STORAGE_KEY) || localStorage.getItem(AUTH_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed?.user) {
        return {
          isAuthenticated: true,
          user: parsed.user,
          rememberMe: Boolean(parsed.rememberMe),
        };
      }
    }
  } catch (err) {
    console.error('Failed to parse officer session:', err);
  }

  return {
    isAuthenticated: false,
    user: null,
    rememberMe: false,
  };
}

export function logoutUser(): void {
  sessionStorage.removeItem(AUTH_STORAGE_KEY);
  localStorage.removeItem(AUTH_STORAGE_KEY);
  localStorage.removeItem(AUTH_TOKEN_KEY);
}
