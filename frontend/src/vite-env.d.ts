/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_DATA_MODE?: 'json' | 'api';
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_API_TIMEOUT_MS?: string;
  readonly VITE_PROJECT_ID?: string;
  readonly VITE_AUTH_MODE?: 'disabled' | 'adabas';
  readonly VITE_ADABAS_LOGIN_URL?: string;
  readonly VITE_PUBLIC_INVITATION_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
