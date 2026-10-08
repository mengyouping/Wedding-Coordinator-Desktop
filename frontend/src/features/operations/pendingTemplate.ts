import type { WeddingTemplateId } from './model';

interface PendingTemplateStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export function pendingOperationsTemplateKey(projectId: string): string {
  if (!projectId.trim()) throw new Error('婚礼项目 ID 不能为空');
  return `wedding.operations.pending-template.${projectId}`;
}

export function storePendingOperationsTemplate(
  storage: Pick<PendingTemplateStorage, 'setItem'>,
  projectId: string,
  templateId: WeddingTemplateId
): void {
  storage.setItem(pendingOperationsTemplateKey(projectId), templateId);
}

export function consumePendingOperationsTemplate(
  storage: Pick<PendingTemplateStorage, 'getItem' | 'removeItem'>,
  projectId: string
): string | null {
  if (!projectId.trim()) return null;
  const key = pendingOperationsTemplateKey(projectId);
  const value = storage.getItem(key);
  storage.removeItem(key);
  return value;
}