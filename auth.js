// auth.js
/**
 * @fileoverview Authentication Layer (Local-First)
 * Mocks auth interactions since no server exists.
 */

// Mock Supabase client
export const sb = {
  auth: {
    onAuthStateChange: (cb) => { 
        // No-op for local
        return { data: { subscription: { unsubscribe: () => {} } } }; 
    },
    getSession: async () => ({ data: { session: { user: { id: 'local-owner' } } } }),
    signOut: async () => ({ error: null })
  }
};

export function initAuth(onLogin, onLogout) {
  const loginBtn = document.getElementById('login-btn');
  const loginOverlay = document.getElementById('login-overlay');

  // Check if session already exists (simple flag)
  if (sessionStorage.getItem('inaiya_session')) {
     onLogin({ user: { id: 'local-owner' } });
     return;
  }

  // Handle "Enter" button click
  if (loginBtn) {
    loginBtn.onclick = () => {
        loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Opening...';
        setTimeout(() => {
            sessionStorage.setItem('inaiya_session', 'true');
            onLogin({ user: { id: 'local-owner' } });
        }, 800);
    };
  }
}

export async function logout() {
  sessionStorage.removeItem('inaiya_session');
  sessionStorage.removeItem('isAppAuthenticated'); // Clear PIN state too
  window.location.reload();
}

// Deprecated in Local Mode
export async function sendMagicLink(email) { return { error: null }; }