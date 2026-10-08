import type { Attachment, MemberRole } from '../../types/domain';

export function canViewAttachment(role: MemberRole, visibility: Attachment['visibility']): boolean {
  return visibility === '项目成员' || role === '所有者';
}

export function canDownloadAttachment(
  role: MemberRole,
  visibility: Attachment['visibility'],
  exportAllowed: boolean
): boolean {
  return exportAllowed && canViewAttachment(role, visibility);
}