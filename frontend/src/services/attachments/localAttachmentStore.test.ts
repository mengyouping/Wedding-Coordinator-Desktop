import { describe, expect, it } from 'vitest';
import type { Attachment } from '../../types/domain';
import { attachmentBlobKey, attachmentStoragePath } from './localAttachmentStore';

const attachment = {
  id: 'attachment-1', entityType: 'contract', entityId: 'contract-1', fileName: '../合同?.pdf',
  mimeType: 'application/pdf', size: 10, storageKey: '', hash: 'a'.repeat(64), uploadedBy: 'Owner',
  uploadedAt: '2026-07-25T00:00:00.000Z', visibility: '项目成员'
} satisfies Attachment;

describe('localAttachmentStore', () => {
  it('生成项目隔离且没有路径穿越的Tauri路径', () => {
    const path = attachmentStoragePath('project-a', attachment);
    expect(path).toBe(`projects/project-a/attachments/aa/${'a'.repeat(64)}-合同_.pdf`);
    expect(path).not.toContain('..');
  });

  it('浏览器Blob键包含项目和附件标识', () => {
    expect(attachmentBlobKey('project-a', attachment.id)).toBe('project-a:attachment-1');
  });
});
