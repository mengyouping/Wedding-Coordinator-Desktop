import { describe, expect, it } from 'vitest';
import { createAttachmentMetadata, formatFileSize, validateAttachment } from './attachmentService';

describe('attachmentService', () => {
  it('拒绝超过 50MB 的附件', () => {
    expect(() => validateAttachment({ name: 'large.pdf', type: 'application/pdf', size: 51 * 1024 * 1024 } as File)).toThrow('50MB');
  });

  it('生成稳定的 SHA-256 元数据', async () => {
    const file = new File(['wedding-contract'], 'contract.pdf', { type: 'application/pdf' });
    const metadata = await createAttachmentMetadata(file, 'contract', 'c1', '总指挥');
    expect(metadata.hash).toHaveLength(64);
    expect(metadata.storageKey).toContain(metadata.hash);
    expect(metadata.entityId).toBe('c1');
  });

  it('格式化文件大小', () => {
    expect(formatFileSize(2048)).toBe('2.0 KB');
  });
});
