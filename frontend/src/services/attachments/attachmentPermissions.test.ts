import { describe, expect, it } from 'vitest';
import { canDownloadAttachment, canViewAttachment } from './attachmentPermissions';

describe('附件权限', () => {
  it('仅所有者附件不会向其他角色展示', () => {
    expect(canViewAttachment('所有者', '仅所有者')).toBe(true);
    expect(canViewAttachment('总指挥', '仅所有者')).toBe(false);
    expect(canViewAttachment('协作者', '仅所有者')).toBe(false);
    expect(canViewAttachment('只读', '仅所有者')).toBe(false);
  });

  it('下载同时要求可见权限与隐私导出权限', () => {
    expect(canDownloadAttachment('所有者', '仅所有者', true)).toBe(true);
    expect(canDownloadAttachment('所有者', '仅所有者', false)).toBe(false);
    expect(canDownloadAttachment('总指挥', '仅所有者', true)).toBe(false);
    expect(canDownloadAttachment('总指挥', '项目成员', true)).toBe(true);
  });
});