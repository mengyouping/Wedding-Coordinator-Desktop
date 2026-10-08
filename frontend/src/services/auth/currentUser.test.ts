import { describe, expect, it } from 'vitest';
import type { WeddingDatabase } from '../../types/domain';
import { resolveCurrentUser } from './currentUser';

const database = {
  members: [{ id: 'owner', email: 'owner@example.com', name: 'Owner', role: '所有者', active: true }],
  profile: { coordinatorName: 'Owner' }
} as unknown as WeddingDatabase;

describe('resolveCurrentUser', () => {
  it('登录账号未匹配项目成员时拒绝访问', () => {
    expect(resolveCurrentUser(database, { accessToken: 'token', userId: 'outsider', userName: 'Outsider' }, false)).toBeNull();
  });

  it('JSON单机模式允许项目本地所有者', () => {
    expect(resolveCurrentUser(database, null, true)?.role).toBe('所有者');
  });

  it('登录账号匹配成员时使用成员角色', () => {
    expect(resolveCurrentUser(database, { accessToken: 'token', userId: 'owner', userName: 'Owner' }, false)?.role).toBe('所有者');
  });
});
