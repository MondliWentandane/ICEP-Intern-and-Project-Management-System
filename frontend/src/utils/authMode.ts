export function isMockAuthEnabled() {
  return import.meta.env.DEV && import.meta.env.VITE_AUTH_MODE === 'mock'
}
