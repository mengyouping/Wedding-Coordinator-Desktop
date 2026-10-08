import { describe, expect, it } from 'vitest';
import { assertPermission, canRole } from './permissionMatrix';

 describe('permissionMatrix', () => {
  it('只读角色不能修改项目或导出隐私数据', () => {
    expect(canRole('只读', 'project.read')).toBe(true);
    expect(canRole('只读', 'project.write')).toBe(false);
    expect(canRole('只读', 'privacy.export')).toBe(false);
  });

  it('所有者可以管理成员和删除项目', () => {
    expect(canRole('所有者', 'member.manage')).toBe(true);
    expect(canRole('所有者', 'project.delete')).toBe(true);
  });

  it('无权限时抛出稳定错误码', () => {
    expect(() => assertPermission({ id: 'u1', name: '访客', email: '', role: '只读', deviceId: 'd1' }, 'project.write'))
      .toThrow('PERMISSION_DENIED');
  });
});
