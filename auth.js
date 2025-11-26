// auth.js
/**
 * @fileoverview Authentication Layer (Local PWA Version)
 * ------------------------------------------------------------------
 * This replaces the Supabase Auth client.
 * It uses sessionStorage to simulate a "logged in" state during the
 * browser session, without sending credentials to any server.
 */

// Mock Supabase client object
// This ensures that if any legacy code tries to import 'sb', it won't crash.
export const sb = {
  auth: {
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    getSession: async () => ({ data: { session: { user: { id: 'local-owner' } } } }),
    signOut: async () => ({ error: null })
  }
};

/**
 * Initializes the Local Authentication logic.
 * * @param {Function} onLogin - Callback to run when the user is "authenticated".
 * @param {Function} onLogout - Callback to run on logout (not typically used in local auto-login).
 */
export function initAuth(onLogin, onLogout) {
  const loginBtn = document.getElementById('login-btn');
  
  // 1. Auto-Login Check
  // If the user has previously "logged in" this session, or if we want 
  // to default to logged-in for the PWA (since it's a personal device app).
  if (sessionStorage.getItem('inaiya_session')) {
     onLogin({ user: { id: 'local-owner' } });
     return;
  }

  // 2. Handle Login Button Click
  if (loginBtn) {
    loginBtn.onclick = () => {
        // Add a fake loading delay for better UX
        loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Opening...';
        loginBtn.disabled = true;
        
        setTimeout(() => {
            sessionStorage.setItem('inaiya_session', 'true');
            onLogin({ user: { id: 'local-owner' } });
        }, 800);
    };
  }
}

/**
 * Logs the user out by clearing the session storage.
 * Reloads the page to reset the app state.
 */
export async function logout() {
  sessionStorage.removeItem('inaiya_session');
  sessionStorage.removeItem('isAppAuthenticated'); // Clear PIN state if used
  window.location.reload();
}

/**
 * Deprecated functions (kept for interface compatibility with main.js)
 */
export async function sendMagicLink(email) { 
    console.warn("Magic Link is not available in Local Mode.");
    return { error: null }; 
}