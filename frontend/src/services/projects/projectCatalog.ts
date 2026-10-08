import { appConfig } from '../../config/appConfig';
import type { ProjectSummary, WeddingDatabase } from '../../types/domain';

function safeParse(value: string | null): ProjectSummary[] {
  if (!value) return [];
  try {
    const rows = JSON.parse(value) as ProjectSummary[];
    return Array.isArray(rows) ? rows : [];
  } catch {
    return [];
  }
}

function writeCatalog(rows: ProjectSummary[]): void {
  if (typeof localStorage !== 'undefined') localStorage.setItem(appConfig.projectCatalogKey, JSON.stringify(rows));
}

export function listProjects(): ProjectSummary[] {
  if (typeof localStorage === 'undefined') return [];
  return safeParse(localStorage.getItem(appConfig.projectCatalogKey))
    .sort((first, second) => second.lastOpenedAt.localeCompare(first.lastOpenedAt));
}

export function summarizeProject(database: WeddingDatabase): ProjectSummary {
  return {
    projectId: database.projectId,
    projectName: database.settings.projectName,
    groomName: database.profile.groomName,
    brideName: database.profile.brideName,
    weddingDate: database.profile.weddingDate,
    status: database.settings.status,
    archived: database.settings.archived,
    lastOpenedAt: new Date().toISOString(),
    revision: database.revision
  };
}

export function upsertProjectSummary(database: WeddingDatabase): ProjectSummary[] {
  const summary = summarizeProject(database);
  const rows = listProjects();
  const next = rows.some(item => item.projectId === summary.projectId)
    ? rows.map(item => item.projectId === summary.projectId ? summary : item)
    : [summary, ...rows];
  writeCatalog(next);
  return next;
}

export function removeProjectSummary(projectId: string): ProjectSummary[] {
  const next = listProjects().filter(item => item.projectId !== projectId);
  writeCatalog(next);
  return next;
}

export function setActiveProjectId(projectId: string): void {
  if (typeof localStorage !== 'undefined') localStorage.setItem(appConfig.activeProjectKey, projectId);
}

export function getActiveProjectId(): string {
  if (typeof localStorage === 'undefined') return appConfig.defaultProjectId;
  return localStorage.getItem(appConfig.activeProjectKey) || appConfig.defaultProjectId;
}

export function createProjectId(name: string): string {
  const normalized = name.trim().toLowerCase().replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-').replace(/^-|-$/g, '');
  return `${normalized || 'wedding'}-${Date.now().toString(36)}`;
}
