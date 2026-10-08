const numberFromEnv = (value: string | undefined, fallback: number): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

export const appConfig = {
  dataMode: (import.meta.env.VITE_DATA_MODE ?? 'json') as 'json' | 'api',
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:9988/wedding-coordinator/api',
  apiTimeoutMs: numberFromEnv(import.meta.env.VITE_API_TIMEOUT_MS, 12000),
  defaultProjectId: import.meta.env.VITE_PROJECT_ID ?? 'wedding-2026-demo',
  authMode: (import.meta.env.VITE_AUTH_MODE ?? 'disabled') as 'disabled' | 'adabas',
  publicInvitationBaseUrl: import.meta.env.VITE_PUBLIC_INVITATION_BASE_URL ?? '/invite.html',
  localStorageKey: 'wedding-os.database.v4',
  legacyLocalStorageKeys: ['wedding-os.database.v3', 'wedding-os.database.v2'],
  projectCatalogKey: 'wedding-os.projects.v1',
  activeProjectKey: 'wedding-os.active-project',
  themeKey: 'wedding-os.theme.v2',
  authSessionKey: 'wedding-os.auth.session',
  desktopProjectsDirectory: 'projects',
  desktopFileName: 'wedding-data.json',
  maxAttachmentBytes: 50 * 1024 * 1024
} as const;
