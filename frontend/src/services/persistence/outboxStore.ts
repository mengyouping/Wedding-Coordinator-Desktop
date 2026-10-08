import type { ConflictRecord, OutboxCommand, WeddingCommand } from '../../types/domain';

const OUTBOX_KEY = 'wedding-os.outbox.v1';
const CONFLICT_KEY = 'wedding-os.conflicts.v1';
const DB_NAME = 'wedding-os-production';
const STORE_NAME = 'key-value';

function safeParse<T>(value: string | null, fallback: T): T {
  if (!value) return fallback;
  try { return JSON.parse(value) as T; } catch { return fallback; }
}

async function idbSet(key: string, value: unknown): Promise<boolean> {
  if (typeof indexedDB === 'undefined') return false;
  return new Promise(resolve => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE_NAME);
    request.onerror = () => resolve(false);
    request.onsuccess = () => {
      const transaction = request.result.transaction(STORE_NAME, 'readwrite');
      transaction.objectStore(STORE_NAME).put(value, key);
      transaction.oncomplete = () => { request.result.close(); resolve(true); };
      transaction.onerror = () => { request.result.close(); resolve(false); };
    };
  });
}

async function idbGet<T>(key: string): Promise<T | null> {
  if (typeof indexedDB === 'undefined') return null;
  return new Promise(resolve => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE_NAME);
    request.onerror = () => resolve(null);
    request.onsuccess = () => {
      const transaction = request.result.transaction(STORE_NAME, 'readonly');
      const read = transaction.objectStore(STORE_NAME).get(key);
      read.onsuccess = () => { request.result.close(); resolve((read.result as T | undefined) ?? null); };
      read.onerror = () => { request.result.close(); resolve(null); };
    };
  });
}

function localGet<T>(key: string, fallback: T): T {
  if (typeof localStorage === 'undefined') return fallback;
  return safeParse(localStorage.getItem(key), fallback);
}

function localSet(key: string, value: unknown): void {
  if (typeof localStorage !== 'undefined') localStorage.setItem(key, JSON.stringify(value));
}

async function readList<T>(key: string): Promise<T[]> {
  return await idbGet<T[]>(key) ?? localGet<T[]>(key, []);
}

async function writeList<T>(key: string, value: T[]): Promise<void> {
  if (!await idbSet(key, value)) localSet(key, value);
}

export function createOutboxCommand(projectId: string, baseRevision: number, command: WeddingCommand): OutboxCommand {
  return {
    id: crypto.randomUUID(),
    projectId,
    baseRevision,
    command,
    status: '待同步',
    attempts: 0,
    createdAt: new Date().toISOString(),
    lastError: ''
  };
}

export async function listOutbox(projectId?: string): Promise<OutboxCommand[]> {
  const rows = await readList<OutboxCommand>(OUTBOX_KEY);
  return projectId ? rows.filter(row => row.projectId === projectId) : rows;
}

export async function upsertOutbox(command: OutboxCommand): Promise<void> {
  const rows = await listOutbox();
  const next = rows.some(row => row.id === command.id)
    ? rows.map(row => row.id === command.id ? command : row)
    : [...rows, command];
  await writeList(OUTBOX_KEY, next);
}

export async function removeOutbox(id: string): Promise<void> {
  await writeList(OUTBOX_KEY, (await listOutbox()).filter(row => row.id !== id));
}

export async function listConflicts(projectId?: string): Promise<ConflictRecord[]> {
  const rows = await readList<ConflictRecord>(CONFLICT_KEY);
  return projectId ? rows.filter(row => row.projectId === projectId) : rows;
}

export async function upsertConflict(conflict: ConflictRecord): Promise<void> {
  const rows = await listConflicts();
  const next = rows.some(row => row.id === conflict.id)
    ? rows.map(row => row.id === conflict.id ? conflict : row)
    : [...rows, conflict];
  await writeList(CONFLICT_KEY, next);
}

export async function resolveConflict(
  id: string,
  status: ConflictRecord['status'],
  remoteRevision?: number
): Promise<void> {
  const rows = await listConflicts();
  await writeList(CONFLICT_KEY, rows.map(row => row.id === id ? {
    ...row,
    status,
    ...(remoteRevision ? { remoteRevision } : {})
  } : row));
}
