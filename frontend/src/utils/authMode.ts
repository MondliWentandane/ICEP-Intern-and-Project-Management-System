export function isMockAuthEnabled() {
  // Local development uses mock credentials unless a developer explicitly opts into the API.
  // Vite production builds always use backend authentication.
  return import.meta.env.DEV && import.meta.env.VITE_AUTH_MODE !== 'api'
}
