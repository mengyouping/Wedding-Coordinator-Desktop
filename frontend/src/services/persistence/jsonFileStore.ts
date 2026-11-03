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

// Serialize the complete read/write operation within this JS instance only.
// This is not a cross-window/process lock or a filesystem transaction.
const snapshotQueues = new Map<string, Promise<void>>();
function enqueueSnapshot<T>(projectId: string, operation: () => Promise<T>): Promise<T> {
  const previous = snapshotQueues.get(projectId) ?? Promise.resolve();
  const current = previous.then(operation);
  const tracked = current.then(() => undefined, () => undefined);
  snapshotQueues.set(projectId, tracked);
  void tracked.then(() => {
    if (snapshotQueues.get(projectId) === tracked) snapshotQueues.delete(projectId);
  });
  return current;
}

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

function parseStoredSnapshot(text: string, projectId: string): WeddingDatabase {
  const raw: unknown = JSON.parse(text);
  if (!raw || typeof raw !== 'object' || Array.isArray(raw) || !('projectId' in raw) || raw.projectId !== projectId) {
    throw new Error('本地快照与项目不一致，已保留原数据');
  }
  const source = raw as Record<string, unknown>;
  if (![2, 3, 4].includes(source.schemaVersion as number)) throw new Error('不支持的本地快照版本');
  // Migration may supply missing legacy fields, but must not hide damaged values
  // already present in a stored snapshot (for example an object instead of rows).
  const collections = [
    'tasks', 'guests', 'tables', 'seatAssignments', 'seatingPlans', 'vendors', 'timeline',
    'invitations', 'risks', 'materials', 'members', 'attachments', 'quotes', 'contracts',
    'transactions', 'runbookEvents', 'checkIns', 'incidents', 'conflicts', 'outbox', 'auditLogs'
  ];
  for (const field of collections) {
    if (field in source && !Array.isArray(source[field])) throw new Error(`本地快照 ${field} 格式无效`);
  }
  for (const field of ['settings', 'profile', 'budget']) {
    const value = source[field];
    if (field in source && (!value || typeof value !== 'object' || Array.isArray(value))) {
      throw new Error(`本地快照 ${field} 格式无效`);
    }
  }
  const budget = source.budget as Record<string, unknown> | undefined;
  for (const field of ['items', 'categories', 'parameters', 'paymentMilestones']) {
    if (budget && field in budget && !Array.isArray(budget[field])) throw new Error(`本地快照预算 ${field} 格式无效`);
  }
  if (source.schemaVersion === 4 && budget?.workbookVersion === 5) {
    validateDatabase(raw as WeddingDatabase);
  }
  return parseDatabase(raw);
}

function assertRestoreOwnership(text: string | null, projectId: string): void {
  if (text === null) return;
  let raw: unknown;
  try { raw = JSON.parse(text); } catch { return; }
  // A damaged target can be recovered, but recognizable foreign data is not ours
  // to overwrite even when it was stored under this project's filename/key.
  if (raw && typeof raw === 'object' && 'projectId' in raw && typeof raw.projectId === 'string' && raw.projectId !== projectId) {
    throw new Error('恢复目标属于其他项目，已保留原数据');
  }
}

async function ensureDesktopDirectory(): Promise<void> {
  const { exists, mkdir, BaseDirectory } = await import('@tauri-apps/plugin-fs');
  if (!await exists(appConfig.desktopProjectsDirectory, { baseDir: BaseDirectory.AppData })) {
    await mkdir(appConfig.desktopProjectsDirectory, { baseDir: BaseDirectory.AppData, recursive: true });
  }
}

async function writeDesktopSnapshot(data: WeddingDatabase, rotateBackup = true): Promise<void> {
  const serialized = JSON.stringify(data, null, 2);
  const { readTextFile, exists, writeTextFile, BaseDirectory } = await import('@tauri-apps/plugin-fs');
  await ensureDesktopDirectory();
  const fileName = desktopFilePath(data.projectId);
  if (await exists(fileName, { baseDir: BaseDirectory.AppData })) {
    const current = await readTextFile(fileName, { baseDir: BaseDirectory.AppData });
    if (rotateBackup) {
      parseStoredSnapshot(current, data.projectId);
      await writeTextFile(desktopBackupPath(data.projectId), current, { baseDir: BaseDirectory.AppData });
    } else assertRestoreOwnership(current, data.projectId);
  }
  await writeTextFile(fileName, serialized, { baseDir: BaseDirectory.AppData });
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

async function loadSnapshot(projectId: string): Promise<WeddingDatabase> {
  const isTauri = '__TAURI_INTERNALS__' in window;
  if (isTauri) {
    const { readTextFile, exists, BaseDirectory } = await import('@tauri-apps/plugin-fs');
    await ensureDesktopDirectory();
    const fileName = desktopFilePath(projectId);
    if (await exists(fileName, { baseDir: BaseDirectory.AppData })) {
      return parseStoredSnapshot(await readTextFile(fileName, { baseDir: BaseDirectory.AppData }), projectId);
    }
    const initial = createInitial(projectId);
    await writeDesktopSnapshot(initial);
    return structuredClone(initial);
  }
  const current = localStorage.getItem(browserKey(projectId));
  const legacy = readLegacyBrowserSnapshot(projectId);
  const stored = current ?? legacy;
  if (stored === null) return createInitial(projectId);
  try {
    const migrated = current === null ? parseImportedDatabase(stored) : parseStoredSnapshot(stored, projectId);
    const normalized = { ...migrated, projectId };
    if (current === null || legacy || migrated.budget.workbookVersion !== 5) {
      localStorage.setItem(browserKey(projectId), JSON.stringify(normalized));
      for (const key of appConfig.legacyLocalStorageKeys) localStorage.removeItem(key);
    }
    return normalized;
  } catch (error) {
    const backup = localStorage.getItem(browserBackupKey(projectId));
    if (backup !== null) return parseStoredSnapshot(backup, projectId);
    throw error;
  }
}

export function loadJsonSnapshot(projectId = appConfig.defaultProjectId): Promise<WeddingDatabase> {
  return enqueueSnapshot(projectId, () => loadSnapshot(projectId));
}

function prepareSnapshot(data: WeddingDatabase): WeddingDatabase {
  return validateDatabase(applyFinancialProjection(migrateBudgetWorkbook({
    ...structuredClone(data), schemaVersion: 4, revision: Math.max(1, data.revision), updatedAt: new Date().toISOString(), conflicts: [], outbox: []
  })));
}

async function writeSnapshot(next: WeddingDatabase, rotateBackup: boolean): Promise<WeddingDatabase> {
  if ('__TAURI_INTERNALS__' in window) await writeDesktopSnapshot(next, rotateBackup);
  else {
    const serialized = JSON.stringify(next);
    const key = browserKey(next.projectId);
    const current = localStorage.getItem(key);
    if (rotateBackup) {
      if (current !== null) {
        // Fail closed instead of replacing a good backup with a corrupt primary.
        parseStoredSnapshot(current, next.projectId);
        localStorage.setItem(browserBackupKey(next.projectId), current);
      }
    } else assertRestoreOwnership(current, next.projectId);
    localStorage.setItem(key, serialized);
  }
  return next;
}

export async function saveJsonSnapshot(data: WeddingDatabase): Promise<WeddingDatabase> {
  const next = prepareSnapshot(data);
  return enqueueSnapshot(next.projectId, () => writeSnapshot(next, true));
}

export async function resetJsonSnapshot(projectId = appConfig.defaultProjectId): Promise<WeddingDatabase> { return saveJsonSnapshot(createInitial(projectId)); }

async function restoreBackup(projectId: string): Promise<WeddingDatabase> {
  if ('__TAURI_INTERNALS__' in window) {
    const { readTextFile, exists, BaseDirectory } = await import('@tauri-apps/plugin-fs');
    const fileName = desktopBackupPath(projectId);
    if (!await exists(fileName, { baseDir: BaseDirectory.AppData })) throw new Error('暂无桌面备份');
    const backup = await readTextFile(fileName, { baseDir: BaseDirectory.AppData });
    return writeSnapshot(prepareSnapshot(parseStoredSnapshot(backup, projectId)), false);
  }
  const backup = localStorage.getItem(browserBackupKey(projectId));
  if (backup === null) throw new Error('暂无浏览器备份');
  return writeSnapshot(prepareSnapshot(parseStoredSnapshot(backup, projectId)), false);
}

export function restoreJsonBackup(projectId = appConfig.defaultProjectId): Promise<WeddingDatabase> {
  return enqueueSnapshot(projectId, () => restoreBackup(projectId));
}

async function deleteSnapshot(projectId: string): Promise<void> {
  if ('__TAURI_INTERNALS__' in window) {
    const { exists, remove, BaseDirectory } = await import('@tauri-apps/plugin-fs');
    for (const fileName of [desktopFilePath(projectId), desktopBackupPath(projectId)]) if (await exists(fileName, { baseDir: BaseDirectory.AppData })) await remove(fileName, { baseDir: BaseDirectory.AppData });
    return;
  }
  localStorage.removeItem(browserKey(projectId));
  localStorage.removeItem(browserBackupKey(projectId));
}

export function deleteJsonSnapshot(projectId: string): Promise<void> {
  return enqueueSnapshot(projectId, () => deleteSnapshot(projectId));
}

export const projectStorageKey = browserKey;
