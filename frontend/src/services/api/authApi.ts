import type { AuthSession } from '../auth/authSession';
import { requestJson } from '../http/httpClient';

export interface LoginUrlResponse {
  loginUrl: string;
}

export interface VerifyTokenResponse {
  valid: boolean;
  userId?: string;
  userInfo?: {
    id?: string;
    name?: string;
    nickname?: string;
    username?: string;
    [key: string]: unknown;
  };
}

export interface ProfileUrlResponse {
  profileUrl: string;
}

export function buildLoginUrlRequest(redirectUri: string): { redirectUri: string } {
  const value = redirectUri.trim();
  if (!value) throw new Error('登录回调地址不能为空');
  return { redirectUri: value };
}

export function normalizeVerifyTokenResponse(response: VerifyTokenResponse): AuthSession {
  if (!response.valid) throw new Error('登录令牌无效');
  const userId = response.userId?.trim() || response.userInfo?.id?.trim();
  if (!userId) throw new Error('登录响应缺少用户ID');
  const userName = response.userInfo?.name?.trim()
    || response.userInfo?.nickname?.trim()
    || response.userInfo?.username?.trim()
    || '已登录用户';
  return { accessToken: '', userId, userName };
}

export const authApi = {
  loginUrl(redirectUri: string): Promise<LoginUrlResponse> {
    return requestJson<LoginUrlResponse>('/auth/login-url', {
      method: 'POST',
      body: JSON.stringify(buildLoginUrlRequest(redirectUri))
    });
  },

  verifyToken(accessToken: string): Promise<VerifyTokenResponse> {
    const token = accessToken.trim();
    if (!token) return Promise.reject(new Error('登录令牌不能为空'));
    return requestJson<VerifyTokenResponse>('/auth/verify-token', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ accessToken: token })
    });
  },

  profileUrl(): Promise<ProfileUrlResponse> {
    return requestJson<ProfileUrlResponse>('/auth/profile-url');
  }
};
