import { describe, expect, it } from 'vitest';
import { parseAuthCallback } from './authSession';

describe('parseAuthCallback', () => {
  it('从回调参数解析访问令牌和用户信息', () => {
    const result = parseAuthCallback('#access_token=token-123&user_id=u1&user_name=%E6%80%BB%E6%8C%87%E6%8C%A5');
    expect(result).toEqual({ accessToken: 'token-123', userId: 'u1', userName: '总指挥' });
  });

  it('没有访问令牌时返回空值', () => {
    expect(parseAuthCallback('#error=unauthorized')).toBeNull();
  });
});
