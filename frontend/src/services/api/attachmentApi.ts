import type { Attachment, WeddingDatabase } from '../../types/domain';
import { toEntityId, type EntityId } from '../../types/persistence';
import { requestJson } from '../http/httpClient';

export interface AttachmentPresignView {
  uploadUrl: string;
  storageKey: string;
  expiresAt: string;
  headers?: Record<string, string>;
}

export interface AttachmentDownloadView {
  downloadUrl: string;
  expiresAt: string;
}

export function buildAttachmentPresignPath(projectId: EntityId): string {
  const safeProjectId = toEntityId(projectId, '婚礼项目ID');
  return `/wedding/projects/${encodeURIComponent(safeProjectId)}/attachments/presign`;
}

export function buildAttachmentDownloadPath(projectId: EntityId, attachmentId: EntityId): string {
  const safeProjectId = toEntityId(projectId, '婚礼项目ID');
  const safeAttachmentId = toEntityId(attachmentId, '附件ID');
  return `/wedding/projects/${encodeURIComponent(safeProjectId)}/attachments/${encodeURIComponent(safeAttachmentId)}/download`;
}

function attachmentPath(projectId: EntityId, suffix: string): string {
  return `/wedding/projects/${encodeURIComponent(toEntityId(projectId, '婚礼项目ID'))}/attachments/${suffix}`;
}

function writeHeaders(revision: number): HeadersInit {
  if (!Number.isSafeInteger(revision) || revision < 1) throw new Error('Revision必须为正整数');
  return { 'If-Match': String(revision), 'Idempotency-Key': crypto.randomUUID() };
}

export async function uploadAttachmentFile(projectId: EntityId, file: File, metadata: Attachment): Promise<Attachment> {
  const presign = await requestJson<AttachmentPresignView>(buildAttachmentPresignPath(projectId), {
    method: 'POST',
    headers: { 'Idempotency-Key': crypto.randomUUID() },
    body: JSON.stringify({ fileName: file.name, mimeType: file.type || 'application/octet-stream', size: file.size, sha256: metadata.hash })
  });
  const response = await fetch(presign.uploadUrl, {
    method: 'PUT',
    headers: presign.headers,
    body: file
  });
  if (!response.ok) throw new Error(`附件上传失败：HTTP ${response.status}`);
  return { ...metadata, storageKey: presign.storageKey };
}

export async function completeAttachmentUpload(
  projectId: EntityId,
  revision: number,
  metadata: Attachment
): Promise<WeddingDatabase> {
  return requestJson<WeddingDatabase>(attachmentPath(projectId, 'complete'), {
    method: 'POST',
    headers: writeHeaders(revision),
    body: JSON.stringify({
      id: metadata.id,
      entityType: metadata.entityType,
      entityId: metadata.entityId,
      fileName: metadata.fileName,
      mimeType: metadata.mimeType,
      size: metadata.size,
      storageKey: metadata.storageKey,
      sha256: metadata.hash,
      visibility: metadata.visibility
    })
  });
}

export async function getAttachmentDownloadUrl(projectId: EntityId, attachmentId: EntityId): Promise<string> {
  const result = await requestJson<AttachmentDownloadView>(buildAttachmentDownloadPath(projectId, attachmentId));
  return result.downloadUrl;
}

export function deleteAttachment(projectId: EntityId, attachmentId: EntityId, revision: number): Promise<WeddingDatabase> {
  return requestJson<WeddingDatabase>(attachmentPath(
    projectId,
    `${encodeURIComponent(toEntityId(attachmentId, '附件ID'))}`
  ), { method: 'DELETE', headers: writeHeaders(revision) });
}

export function grantAttachmentAccess(
  projectId: EntityId,
  attachmentId: EntityId,
  revision: number,
  grant: Record<string, unknown>
): Promise<WeddingDatabase> {
  return requestJson<WeddingDatabase>(attachmentPath(
    projectId,
    `${encodeURIComponent(toEntityId(attachmentId, '附件ID'))}/grants`
  ), { method: 'POST', headers: writeHeaders(revision), body: JSON.stringify(grant) });
}

export function revokeAttachmentAccess(
  projectId: EntityId,
  attachmentId: EntityId,
  grantId: EntityId,
  revision: number
): Promise<WeddingDatabase> {
  return requestJson<WeddingDatabase>(attachmentPath(
    projectId,
    `${encodeURIComponent(toEntityId(attachmentId, '附件ID'))}/grants/${encodeURIComponent(toEntityId(grantId, '授权ID'))}`
  ), { method: 'DELETE', headers: writeHeaders(revision) });
}
