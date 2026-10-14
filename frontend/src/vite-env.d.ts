/// <reference types="vite/client" />
interface ImportMetaEnv { readonly VITE_API_BASE_URL?: string; readonly VITE_API_PROXY_TARGET?: string; readonly VITE_DEV_AUTH_ROLE?: 'admin' | 'wil_handler' | 'mentor' | 'intern' }
interface ImportMeta { readonly env: ImportMetaEnv }
