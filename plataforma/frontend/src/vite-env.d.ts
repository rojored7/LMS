/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_API_TIMEOUT: string;
  readonly VITE_STORAGE_KEY_PREFIX: string;
  readonly VITE_DEFAULT_PAGE_SIZE: string;
  readonly VITE_JWT_REFRESH_THRESHOLD: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
