import { appConfig } from '../../config/appConfig';
import { createEmptyWeddingDatabase } from '../../data/createEmptyWeddingDatabase';
import { initialWeddingDatabase } from '../../data/seed';
import { migrateBudgetWorkbook } from '../../features/budget/migrations/budgetWorkbookMigration';
import { hydrateBudgetWorkbookSource } from '../../features/budget/migrations/budgetWorkbookSourceHydrator';
import { applyFinancialProjection } from '../../features/finance/financialProjection';
import { migrateLegacyFinancialFacts } from '../../features/finance/legacyFinancialMigration';
import type { WeddingDatabase } from '../../types/domain';
import { validateDatabase } from './databaseValidator';
import { migrateDatabase } from './migrations';

const browserKey = (projectId: string): string => `${appConfig.localStorageKey}.${projectId}`;
const browserBackupKey = (projectId: string): string => `${browserKey(projectId)}.backup`;
const desktopFilePath = (projectId: string): string => `${appConfig.desktopProjectsDirectory}/${projectId}.json`;
const desktopBackupPath = (projectId: string): string => `${appConfig.desktopProjectsDirectory}/${projectId}.backup.json`;

/**
 * Outbox 与 Conflict 由 IndexedDB/LocalStorage 独立持久层维护，不再从项目快照恢复。
 * 所有加载、导入和 API 响应先恢复预算扩展字段、迁移旧财务事实和预算工作簿，再重新计算财务派生字段。
 */
export function parseDatabase(value: unknown): WeddingDatabase {
  const generic = migrateDatabase(value);
  const hydrated = hydrateBudgetWorkbookSource(value, generic);
  const migrated = migrateBudgetWorkbook(migrateLegacyFinancialFacts(hydrated));
  return validateDatabase(applyFinancialProjection({ ...migrated, conflicts: [], outbox: [] }));
}

export function parseImportedDatabase(text: string): WeddingDatabase {
  return parseDatabase(JSON.parse(text) as unknown);
}

async function ensureDesktopDirectory(): Promise<void> {
  const { exists, mkdir, BaseDirectory } = await import('@tauri-apps/plugin-fs');
  if (!await exists(appConfig.desktopProjectsDirectory, { baseDir: BaseDirectory.AppData })) {
    await mkdir(appConfig.desktopProjectsDirectory, { baseDir: BaseDirectory.AppData, recursive: true });
  }
}

async function writeDesktopSnapshot(data: WeddingDatabase): Promise<void> {
  const { readTextFile, exists, writeTextFile, BaseDirectory } = await import('@tauri-apps/plugin-fs');
  await ensureDesktopDirectory();
  const fileName = desktopFilePath(data.projectId);
  if (await exists(fileName, { baseDir: BaseDirectory.AppData })) {
    const current = await readTextFile(fileName, { baseDir: BaseDirectory.AppData });
    await writeTextFile(desktopBackupPath(data.projectId), current, { baseDir: BaseDirectory.AppData });
  }
  await writeTextFile(fileName, JSON.stringify(data, null, 2), { baseDir: BaseDirectory.AppData });
}

function createInitial(projectId: string): WeddingDatabase {
  const initial = parseDatabase(initialWeddingDatabase);
  if (projectId === initial.projectId) return { ...structuredClone(initial), projectId, revision: 1, updatedAt: new Date().toISOString() };
  const owner = initial.members.find(item => item.role === '所有者') ?? { id: 'member-owner', name: '本地所有者', email: '', role: '所有者' as const, active: true };
  return createEmptyWeddingDatabase(initial, projectId, '新婚礼项目', owner);
}

function readLegacyBrowserSnapshot(projectId: string): string | null {
  if (projectId !== appConfig.defaultProjectId) return null;
  for (const key of appConfig.legacyLocalStorageKeys) {
    const stored = localStorage.getItem(key);
    if (stored) return stored;
  }
  return null;
}

export async function loadJsonSnapshot(projectId = appConfig.defaultProjectId): Promise<WeddingDatabase> {
  const isTauri = '__TAURI_INTERNALS__' in window;
  if (isTauri) {
    const { readTextFile, exists, BaseDirectory } = await import('@tauri-apps/plugin-fs');
    await ensureDesktopDirectory();
    const fileName = desktopFilePath(projectId);
    if (await exists(fileName, { baseDir: BaseDirectory.AppData })) {
      const migrated = parseImportedDatabase(await readTextFile(fileName, { baseDir: BaseDirectory.AppData }));
      if (migrated.projectId !== projectId || migrated.budget.workbookVersion !== 5) await writeDesktopSnapshot({ ...migrated, projectId });
      return { ...migrated, projectId };
    }
    const initial = createInitial(projectId);
    await writeDesktopSnapshot(initial);
    return structuredClone(initial);
  }
  const current = localStorage.getItem(browserKey(projectId));
  const legacy = readLegacyBrowserSnapshot(projectId);
  const stored = current ?? legacy;
  if (!stored) return createInitial(projectId);
  try {
    const migrated = parseImportedDatabase(stored);
    const normalized = { ...migrated, projectId };
    if (!current || legacy || migrated.budget.workbookVersion !== 5) {
      localStorage.setItem(browserKey(projectId), JSON.stringify(normalized));
      for (const key of appConfig.legacyLocalStorageKeys) localStorage.removeItem(key);
    }
    return normalized;
  } catch (error) {
    const backup = localStorage.getItem(browserBackupKey(projectId));
    if (backup) return parseImportedDatabase(backup);
    throw error;
  }
}

export async function saveJsonSnapshot(data: WeddingDatabase): Promise<WeddingDatabase> {
  const next = validateDatabase(applyFinancialProjection(migrateBudgetWorkbook({
    ...structuredClone(data), schemaVersion: 4, revision: Math.max(1, data.revision), updatedAt: new Date().toISOString(), conflicts: [], outbox: []
  })));
  if ('__TAURI_INTERNALS__' in window) await writeDesktopSnapshot(next);
  else {
    const key = browserKey(next.projectId);
    const current = localStorage.getItem(key);
    if (current) localStorage.setItem(browserBackupKey(next.projectId), current);
    localStorage.setItem(key, JSON.stringify(next));
  }
  return next;
}

export async function resetJsonSnapshot(projectId = appConfig.defaultProjectId): Promise<WeddingDatabase> { return saveJsonSnapshot(createInitial(projectId)); }

export async function restoreJsonBackup(projectId = appConfig.defaultProjectId): Promise<WeddingDatabase> {
  if ('__TAURI_INTERNALS__' in window) {
    const { readTextFile, exists, BaseDirectory } = await import('@tauri-apps/plugin-fs');
    const fileName = desktopBackupPath(projectId);
    if (!await exists(fileName, { baseDir: BaseDirectory.AppData })) throw new Error('暂无桌面备份');
    return saveJsonSnapshot({ ...parseImportedDatabase(await readTextFile(fileName, { baseDir: BaseDirectory.AppData })), projectId });
  }
  const backup = localStorage.getItem(browserBackupKey(projectId));
  if (!backup) throw new Error('暂无浏览器备份');
  return saveJsonSnapshot({ ...parseImportedDatabase(backup), projectId });
}

export async function deleteJsonSnapshot(projectId: string): Promise<void> {
  if ('__TAURI_INTERNALS__' in window) {
    const { exists, remove, BaseDirectory } = await import('@tauri-apps/plugin-fs');
    for (const fileName of [desktopFilePath(projectId), desktopBackupPath(projectId)]) if (await exists(fileName, { baseDir: BaseDirectory.AppData })) await remove(fileName, { baseDir: BaseDirectory.AppData });
    return;
  }
  localStorage.removeItem(browserKey(projectId));
  localStorage.removeItem(browserBackupKey(projectId));
}

export const projectStorageKey = browserKey;
