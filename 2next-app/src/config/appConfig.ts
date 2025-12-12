type KeycloakConfig = {
  url: string
  realm: string
  clientId: string
}

type AppConfig = {
  apiBaseUrl: string
  keycloak: KeycloakConfig
}

function normalizeUrl(url: string): string {
  return url.replace(/\/+$/, '')
}

function readEnvString(key: keyof ImportMetaEnv, fallback: string): string {
  const value = import.meta.env[key]
  if (typeof value === 'string' && value.trim() !== '') {
    return value
  }
  return fallback
}

export const appConfig: AppConfig = {
  apiBaseUrl: normalizeUrl(readEnvString('VITE_API_BASE_URL', 'http://localhost:38707/api')),
  keycloak: {
    url: normalizeUrl(readEnvString('VITE_KEYCLOAK_URL', 'https://auth.semantyca.com')),
    realm: readEnvString('VITE_KEYCLOAK_REALM', 'master'),
    clientId: readEnvString('VITE_KEYCLOAK_CLIENT_ID', '2next')
  }
}
