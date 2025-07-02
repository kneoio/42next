import Keycloak from 'keycloak-js'

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

    try {
      const authenticated = await this.keycloak.init({
        onLoad: 'check-sso',
        silentCheckSsoRedirectUri: window.location.origin + '/silent-check-sso.html'
      })

      globalInitialized = true
      this.state.isAuthenticated = authenticated
      globalAuthState.isAuthenticated = authenticated
      
      if (authenticated) {
        this.state.token = this.keycloak.token || null
        this.state.userProfile = await this.keycloak.loadUserProfile()
        globalAuthState.token = this.state.token
        globalAuthState.userProfile = this.state.userProfile
      }

      // Set up token refresh
      this.keycloak.onTokenExpired = () => {
        this.refreshToken()
      }

      return authenticated
    } catch (error) {
      console.error('Failed to initialize Keycloak:', error)
      globalInitialized = false
      return false
    }
  }

  async login(): Promise<void> {
    try {
      await this.keycloak.login({
        redirectUri: window.location.origin
      })
    } catch (error) {
      console.error('Login failed:', error)
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
      }
      return refreshed
    } catch (error) {
      console.error('Token refresh failed:', error)
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
}

export const authService = new AuthService()
export default authService
