import { describe, expect, it } from 'vitest';
import { buildLoginUrlRequest, normalizeVerifyTokenResponse } from './authApi';

describe('authApi contract', () => {
  it('登录地址请求只提交后端认可的redirectUri字段', () => {
    expect(buildLoginUrlRequest('http://localhost:18766/auth/callback')).toEqual({
      redirectUri: 'http://localhost:18766/auth/callback'
    });
  });

  it('拒绝后端判定为无效的令牌', () => {
    expect(() => normalizeVerifyTokenResponse({ valid: false })).toThrow('登录令牌无效');
  });

  it('把后端用户资料转换为前端会话', () => {
    expect(normalizeVerifyTokenResponse({
      valid: true,
      userId: 'user-001',
      userInfo: { id: 'user-001', name: '婚礼总指挥' }
    })).toEqual({
      accessToken: '',
      userId: 'user-001',
      userName: '婚礼总指挥'
    });
  });
});
