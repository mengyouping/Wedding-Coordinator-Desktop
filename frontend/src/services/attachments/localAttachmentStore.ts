import type { Attachment } from '../../types/domain';

const DB_NAME = 'wedding-os-attachments';
const STORE_NAME = 'blobs';

function safeSegment(value: string): string {
  return value
    .trim()
    .replace(/[^a-zA-Z0-9\u4e00-\u9fa5._-]+/g, '_')
    .replace(/^\.+/, '')
    .replace(/^[_-]+/, '') || 'file';
}

export function attachmentBlobKey(projectId: string, attachmentId: string): string {
  return `${projectId}:${attachmentId}`;
}

export function attachmentStoragePath(projectId: string, attachment: Pick<Attachment, 'hash' | 'fileName'>): string {
  const hash = safeSegment(attachment.hash.toLowerCase());
  const fileName = safeSegment(attachment.fileName);
  return `projects/${safeSegment(projectId)}/attachments/${hash.slice(0, 2)}/${hash}-${fileName}`;
}

function isTauri(): boolean {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
}

async function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE_NAME)) request.result.createObjectStore(STORE_NAME);
    };
    request.onerror = () => reject(request.error ?? new Error('附件数据库打开失败'));
    request.onsuccess = () => resolve(request.result);
  });
}

async function putBrowserBlob(key: string, blob: Blob): Promise<void> {
  const database = await openDatabase();
  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, 'readwrite');
    transaction.objectStore(STORE_NAME).put(blob, key);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error('附件保存失败'));
  }).finally(() => database.close());
}

async function getBrowserBlob(key: string): Promise<Blob> {
  const database = await openDatabase();
  return new Promise<Blob>((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, 'readonly');
    const request = transaction.objectStore(STORE_NAME).get(key);
    request.onsuccess = () => request.result instanceof Blob ? resolve(request.result) : reject(new Error('本地附件文件不存在'));
    request.onerror = () => reject(request.error ?? new Error('附件读取失败'));
  }).finally(() => database.close());
}

async function deleteBrowserBlob(key: string): Promise<void> {
  const database = await openDatabase();
  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, 'readwrite');
    transaction.objectStore(STORE_NAME).delete(key);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error('附件删除失败'));
  }).finally(() => database.close());
}

async function deleteBrowserProjectBlobs(projectId: string): Promise<void> {
  const database = await openDatabase();
  const prefix = `${projectId}:`;
  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const cursor = store.openCursor();
    cursor.onsuccess = () => {
      const current = cursor.result;
      if (!current) return;
      if (String(current.key).startsWith(prefix)) current.delete();
      current.continue();
    };
    cursor.onerror = () => reject(cursor.error ?? new Error('项目附件清理失败'));
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error('项目附件清理失败'));
  }).finally(() => database.close());
}

async function ensureTauriParent(path: string): Promise<void> {
  const { exists, mkdir, BaseDirectory } = await import('@tauri-apps/plugin-fs');
  const parent = path.slice(0, path.lastIndexOf('/'));
  if (!await exists(parent, { baseDir: BaseDirectory.AppData })) {
    await mkdir(parent, { baseDir: BaseDirectory.AppData, recursive: true });
  }
}

export async function storeLocalAttachment(projectId: string, file: File, metadata: Attachment): Promise<Attachment> {
  const storageKey = attachmentStoragePath(projectId, metadata);
  if (isTauri()) {
    const { writeFile, BaseDirectory } = await import('@tauri-apps/plugin-fs');
    await ensureTauriParent(storageKey);
    await writeFile(storageKey, new Uint8Array(await file.arrayBuffer()), { baseDir: BaseDirectory.AppData });
  } else {
    await putBrowserBlob(attachmentBlobKey(projectId, metadata.id), file);
  }
  return { ...metadata, storageKey };
}

export async function readLocalAttachment(projectId: string, attachment: Attachment): Promise<Blob> {
  if (isTauri()) {
    const { readFile, BaseDirectory } = await import('@tauri-apps/plugin-fs');
    const bytes = await readFile(attachment.storageKey || attachmentStoragePath(projectId, attachment), { baseDir: BaseDirectory.AppData });
    const copy = new Uint8Array(bytes.byteLength);
    copy.set(bytes);
    return new Blob([copy.buffer], { type: attachment.mimeType });
  }
  return getBrowserBlob(attachmentBlobKey(projectId, attachment.id));
}

export async function deleteLocalAttachment(projectId: string, attachment: Attachment): Promise<void> {
  if (isTauri()) {
    const { exists, remove, BaseDirectory } = await import('@tauri-apps/plugin-fs');
    const path = attachment.storageKey || attachmentStoragePath(projectId, attachment);
    if (await exists(path, { baseDir: BaseDirectory.AppData })) await remove(path, { baseDir: BaseDirectory.AppData });
    return;
  }
  await deleteBrowserBlob(attachmentBlobKey(projectId, attachment.id));
}

export async function deleteProjectAttachments(projectId: string): Promise<void> {
  if (isTauri()) {
    const { exists, remove, BaseDirectory } = await import('@tauri-apps/plugin-fs');
    const directory = `projects/${safeSegment(projectId)}/attachments`;
    if (await exists(directory, { baseDir: BaseDirectory.AppData })) {
      await remove(directory, { baseDir: BaseDirectory.AppData, recursive: true });
    }
    return;
  }
  await deleteBrowserProjectBlobs(projectId);
}

export async function downloadLocalAttachment(projectId: string, attachment: Attachment): Promise<void> {
  const blob = await readLocalAttachment(projectId, attachment);
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = attachment.fileName;
  anchor.click();
  URL.revokeObjectURL(url);
}
