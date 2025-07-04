import Keycloak from 'keycloak-js'

// Utility function to clear all cookies for the current domain
function clearAuthCookies() {
  const cookies = document.cookie.split(';')
  
  for (let cookie of cookies) {
    const eqPos = cookie.indexOf('=')
    const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim()
    
    // Clear cookie for current domain
    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`
    
    // Clear cookie for parent domain (if subdomain)
    const domain = window.location.hostname
    if (domain.includes('.')) {
      const parentDomain = domain.substring(domain.indexOf('.'))
      document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${parentDomain}`
    }
  }
  
  // Clear localStorage and sessionStorage as well
  localStorage.clear()
  sessionStorage.clear()
  
  console.log('Auth cookies and storage cleared')
}

interface AuthState {
  isAuthenticated: boolean
  token: string | null
  userProfile: any
}

// Global singleton state to prevent multiple initializations across hot reloads
let globalKeycloakInstance: Keycloak | null = null
let globalInitialized = false
let globalAuthState: AuthState = {
  isAuthenticated: false,
  token: null,
  userProfile: null
}

class AuthService {
  private keycloak: Keycloak
  private state: AuthState

  constructor() {
    // Use global singleton instance if available
    if (globalKeycloakInstance) {
      this.keycloak = globalKeycloakInstance
      this.state = globalAuthState
    } else {
      this.keycloak = new Keycloak({
        url: 'https://auth.kneo.io',
        realm: 'kneo',
        clientId: '2next'
      })
      globalKeycloakInstance = this.keycloak
      this.state = globalAuthState
    }
  }

  async init(): Promise<boolean> {
    // Prevent multiple initializations using global flag
    if (globalInitialized) {
      return this.state.isAuthenticated
    }

    // Set up global error handler to catch 502 errors from network requests
    const originalFetch = window.fetch
    let has502Error = false

    window.fetch = async (...args) => {
      try {
        const response = await originalFetch(...args)
        if (response.status === 502) {
          has502Error = true
          console.error('502 Bad Gateway detected in fetch request')
        }
        return response
      } catch (error) {
        if (error instanceof Error && error.message.includes('502')) {
          has502Error = true
          console.error('502 Bad Gateway detected in fetch error')
        }
        throw error
      }
    }

    try {
      const authenticated = await this.keycloak.init({
        onLoad: 'check-sso',
        silentCheckSsoRedirectUri: window.location.origin + '/silent-check-sso.html',
        checkLoginIframe: false, // Disable iframe check to avoid cross-domain issues
        enableLogging: true, // Enable logging for debugging
        pkceMethod: 'S256', // Use PKCE for better security
        flow: 'standard' // Use standard flow instead of implicit
      })

      // Check if any 502 errors occurred during initialization
      if (has502Error) {
        console.log('502 error detected during Keycloak init, clearing cookies...')
        clearAuthCookies()
        
        // Reset global state to allow retry
        globalInitialized = false
        globalKeycloakInstance = null
        
        // Restore original fetch
        window.fetch = originalFetch
        
        // Reload the page to start fresh
        setTimeout(() => window.location.reload(), 1000)
        return false
      }

      globalInitialized = true
      this.state.isAuthenticated = authenticated
      globalAuthState.isAuthenticated = authenticated
      
      if (authenticated) {
        this.state.token = this.keycloak.token || null
        this.state.userProfile = await this.keycloak.loadUserProfile()
        globalAuthState.token = this.state.token
        globalAuthState.userProfile = this.state.userProfile
      }

      // Set up token refresh with proper error handling
      this.keycloak.onTokenExpired = async () => {
        console.log('Token expired, attempting refresh...')
        const refreshed = await this.refreshToken()
        if (!refreshed) {
          console.warn('Token refresh failed, redirecting to login')
          // Force re-authentication if refresh fails
          this.login()
        }
      }

      // Restore original fetch
      window.fetch = originalFetch
      
      return authenticated
    } catch (error) {
      console.error('Failed to initialize Keycloak:', error)
      
      // Restore original fetch
      window.fetch = originalFetch
      
      // Check if it's a network error (502, 503, etc.) that might be resolved by clearing cookies
      if (has502Error || (error instanceof Error && (error.message.includes('502') || error.message.includes('Bad Gateway')))) {
        console.log('Detected potential auth cookie issue, clearing cookies and retrying...')
        clearAuthCookies()
        
        // Reset global state to allow retry
        globalInitialized = false
        globalKeycloakInstance = null
        
        // Reload the page to start fresh
        setTimeout(() => window.location.reload(), 1000)
        return false
      }
      
      globalInitialized = false
      return false
    }
  }

  async login(): Promise<void> {
    // Set up global error handler to catch 502 errors from network requests
    const originalFetch = window.fetch
    let has502Error = false

    window.fetch = async (...args) => {
      try {
        const response = await originalFetch(...args)
        if (response.status === 502) {
          has502Error = true
          console.error('502 Bad Gateway detected in login fetch request')
        }
        return response
      } catch (error) {
        if (error instanceof Error && error.message.includes('502')) {
          has502Error = true
          console.error('502 Bad Gateway detected in login fetch error')
        }
        throw error
      }
    }

    try {
      await this.keycloak.login({
        redirectUri: window.location.origin
      })
    } catch (error) {
      console.error('Login failed:', error)
      
      // Check if it's a 502 error that might be resolved by clearing cookies
      if (has502Error || (error instanceof Error && (error.message.includes('502') || error.message.includes('Bad Gateway')))) {
        console.log('502 error detected during login, clearing cookies...')
        clearAuthCookies()
        
        // Reset global state to allow retry
        globalInitialized = false
        globalKeycloakInstance = null
        
        // Restore original fetch
        window.fetch = originalFetch
        
        // Reload the page to start fresh
        setTimeout(() => window.location.reload(), 1000)
        return
      }
    } finally {
      // Always restore original fetch
      window.fetch = originalFetch
    }
  }

  async logout(): Promise<void> {
    try {
      await this.keycloak.logout({
        redirectUri: window.location.origin
      })
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  async refreshToken(): Promise<boolean> {
    try {
      const refreshed = await this.keycloak.updateToken(30)
      if (refreshed) {
        this.state.token = this.keycloak.token || null
        globalAuthState.token = this.state.token
        console.log('Token refreshed successfully')
        return true
      }
      return false
    } catch (error) {
      console.error('Token refresh failed:', error)
      // Clear authentication state on refresh failure
      this.state.isAuthenticated = false
      this.state.token = null
      this.state.userProfile = null
      globalAuthState.isAuthenticated = false
      globalAuthState.token = null
      globalAuthState.userProfile = null
      return false
    }
  }

  getToken(): string | null {
    return this.state.token
  }

  getUserProfile(): any {
    return this.state.userProfile
  }

  isAuthenticated(): boolean {
    return this.state.isAuthenticated
  }

  getAuthHeader(): { Authorization: string } | {} {
    return this.state.token ? { Authorization: `Bearer ${this.state.token}` } : {}
  }

  // Public method to manually clear auth cookies and reset state
  clearAuthData(): void {
    console.log('Manually clearing auth data...')
    clearAuthCookies()
    
    // Reset all state
    this.state.isAuthenticated = false
    this.state.token = null
    this.state.userProfile = null
    globalAuthState.isAuthenticated = false
    globalAuthState.token = null
    globalAuthState.userProfile = null
    globalInitialized = false
    globalKeycloakInstance = null
  }
}

export const authService = new AuthService()
export default authService
