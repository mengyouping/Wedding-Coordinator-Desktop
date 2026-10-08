import { appConfig } from '../../config/appConfig';
import type { Attachment } from '../../types/domain';

const allowedMimePrefixes = ['image/', 'audio/', 'video/'];
const allowedMimeTypes = new Set([
  'application/pdf',
  'application/zip',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
  'text/csv'
]);

export function validateAttachment(file: Pick<File, 'name' | 'size' | 'type'>): void {
  if (!file.name.trim()) throw new Error('附件名称不能为空');
  if (file.size <= 0) throw new Error('附件内容为空');
  if (file.size > appConfig.maxAttachmentBytes) throw new Error('附件不能超过 50MB');
  if (file.type && !allowedMimeTypes.has(file.type) && !allowedMimePrefixes.some(prefix => file.type.startsWith(prefix))) {
    throw new Error(`不支持的附件类型：${file.type}`);
  }
}

export async function hashAttachment(file: Blob): Promise<string> {
  const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', await file.arrayBuffer()));
  return Array.from(digest, byte => byte.toString(16).padStart(2, '0')).join('');
}

export async function createAttachmentMetadata(
  file: File,
  entityType: string,
  entityId: string,
  uploadedBy: string,
  visibility: Attachment['visibility'] = '项目成员'
): Promise<Attachment> {
  validateAttachment(file);
  const hash = await hashAttachment(file);
  return {
    id: crypto.randomUUID(),
    entityType,
    entityId,
    fileName: file.name,
    mimeType: file.type || 'application/octet-stream',
    size: file.size,
    storageKey: `attachments/${hash.slice(0, 2)}/${hash}-${file.name}`,
    hash,
    uploadedBy,
    uploadedAt: new Date().toISOString(),
    visibility
  };
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
