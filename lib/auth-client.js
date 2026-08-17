/**
 * Client-side Authentication & Token Expiry Management
 * Token valid for 1 day (24 hours). Automatically logs out upon expiration.
 */

const TOKEN_KEY = 'nipt_token';
const USER_KEY = 'nipt_user';
const EXPIRES_AT_KEY = 'nipt_expires_at';
const AUTH_MSG_KEY = 'nipt_auth_msg';

/**
 * Parses JWT payload without external library
 */
export function parseJwt(token) {
  try {
    if (!token) return null;
    const base64Url = token.split('.')[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
}

/**
 * Saves auth session after successful login
 * @param {string} token - JWT token
 * @param {object} user - User info
 * @param {number} [expiresAt] - Timestamp in ms when token expires (defaults to 24h)
 */
export function saveAuthSession(token, user, expiresAt) {
  if (typeof window === 'undefined') return;

  // Extract expiration from token if not provided
  if (!expiresAt && token) {
    const payload = parseJwt(token);
    if (payload && payload.exp) {
      expiresAt = payload.exp * 1000;
    }
  }

  // Fallback: 24 hours from now (1 day)
  if (!expiresAt) {
    expiresAt = Date.now() + 24 * 60 * 60 * 1000;
  }

  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  localStorage.setItem(EXPIRES_AT_KEY, expiresAt.toString());
  sessionStorage.removeItem(AUTH_MSG_KEY);
}

/**
 * Checks if current auth session is valid and active
 * @returns {boolean}
 */
export function isAuthValid() {
  if (typeof window === 'undefined') return false;

  const token = localStorage.getItem(TOKEN_KEY);
  const user = localStorage.getItem(USER_KEY);
  const expiresAtStr = localStorage.getItem(EXPIRES_AT_KEY);

  if (!token || !user) return false;

  // Check expiration timestamp
  let expiresAt = expiresAtStr ? parseInt(expiresAtStr, 10) : 0;
  if (!expiresAt || isNaN(expiresAt)) {
    const payload = parseJwt(token);
    if (payload && payload.exp) {
      expiresAt = payload.exp * 1000;
    }
  }

  if (expiresAt && Date.now() >= expiresAt) {
    return false;
  }

  return true;
}

/**
 * Gets currently logged in user if session is valid
 * @returns {object|null}
 */
export function getCurrentUser() {
  if (!isAuthValid()) return null;
  try {
    const userStr = localStorage.getItem(USER_KEY);
    return userStr ? JSON.parse(userStr) : null;
  } catch (e) {
    return null;
  }
}

/**
 * Gets active JWT token
 * @returns {string|null}
 */
export function getAuthToken() {
  if (!isAuthValid()) return null;
  return localStorage.getItem(TOKEN_KEY);
}

/**
 * Clears auth session and redirects to login
 * @param {object} [router] - Next.js router instance
 * @param {string} [reason] - Reason for logout ('expired' | 'manual')
 */
export function logout(router, reason = 'manual') {
  if (typeof window === 'undefined') return;

  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(EXPIRES_AT_KEY);

  if (reason === 'expired') {
    sessionStorage.setItem(AUTH_MSG_KEY, 'Phiên làm việc đã hết hạn (1 ngày). Vui lòng đăng nhập lại.');
  }

  if (router && typeof router.push === 'function') {
    router.push(reason === 'expired' ? '/login?expired=1' : '/login');
  } else {
    window.location.href = reason === 'expired' ? '/login?expired=1' : '/login';
  }
}

/**
 * Helper to authenticate page in useEffect:
 * 1. Checks validity & expiration
 * 2. Sets user state
 * 3. Schedules auto-logout timer when token expires
 * @param {object} router - Next.js router
 * @param {function} setUser - React state setter for user
 * @returns {function} Cleanup function for timer
 */
export function checkAuth(router, setUser) {
  if (typeof window === 'undefined') return () => {};

  if (!isAuthValid()) {
    const hadToken = !!localStorage.getItem(TOKEN_KEY);
    logout(router, hadToken ? 'expired' : 'manual');
    return () => {};
  }

  const user = getCurrentUser();
  if (setUser && user) {
    setUser(user);
  }

  // Calculate remaining time until token expires to trigger auto-logout
  const expiresAtStr = localStorage.getItem(EXPIRES_AT_KEY);
  let expiresAt = expiresAtStr ? parseInt(expiresAtStr, 10) : 0;
  if (!expiresAt) {
    const token = localStorage.getItem(TOKEN_KEY);
    const payload = parseJwt(token);
    if (payload && payload.exp) expiresAt = payload.exp * 1000;
  }

  if (expiresAt) {
    const remainingMs = expiresAt - Date.now();
    if (remainingMs <= 0) {
      logout(router, 'expired');
      return () => {};
    }

    // Schedule auto-logout
    const timerId = setTimeout(() => {
      logout(router, 'expired');
    }, remainingMs);

    return () => clearTimeout(timerId);
  }

  return () => {};
}
