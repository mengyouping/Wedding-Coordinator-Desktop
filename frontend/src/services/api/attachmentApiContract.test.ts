import { describe, expect, it } from 'vitest';
import { buildAttachmentDownloadPath, buildAttachmentPresignPath } from './attachmentApi';

describe('附件API持久化字段契约', () => {
  it('项目ID和附件ID按字符串路径参数编码', () => {
    expect(buildAttachmentPresignPath('project/with space')).toBe('/wedding/projects/project%2Fwith%20space/attachments/presign');
    expect(buildAttachmentDownloadPath('project_001', 'attachment/001')).toBe('/wedding/projects/project_001/attachments/attachment%2F001/download');
  });

  it('拒绝空ID和超过VARCHAR(64)长度的ID', () => {
    expect(() => buildAttachmentPresignPath('')).toThrow(/婚礼项目ID不能为空/);
    expect(() => buildAttachmentDownloadPath('project_001', '附'.repeat(65))).toThrow(/附件ID不能超过64个字符/);
    expect(() => buildAttachmentDownloadPath('项'.repeat(65), 'attachment_001')).toThrow(/婚礼项目ID不能超过64个字符/);
  });
});
