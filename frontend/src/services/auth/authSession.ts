import { appConfig } from '../../config/appConfig';
import { authApi, normalizeVerifyTokenResponse } from '../api/authApi';

export interface AuthSession {
  accessToken: string;
  userId: string;
  userName: string;
}

export function parseAuthCallback(fragment: string): AuthSession | null {
  const query = fragment.replace(/^[#?]/, '');
  const params = new URLSearchParams(query);
  const accessToken = params.get('access_token')?.trim() ?? '';
  if (!accessToken) return null;
  return {
    accessToken,
    userId: params.get('user_id')?.trim() || 'unknown-user',
    userName: params.get('user_name')?.trim() || '已登录用户'
  };
}

export function readAuthSession(): AuthSession | null {
  const stored = sessionStorage.getItem(appConfig.authSessionKey);
  if (!stored) return null;
  try {
    const value = JSON.parse(stored) as Partial<AuthSession>;
    if (!value.accessToken || !value.userId) return null;
    return {
      accessToken: value.accessToken,
      userId: value.userId,
      userName: value.userName || '已登录用户'
    };
  } catch {
    return null;
  }
}

export function writeAuthSession(session: AuthSession): void {
  sessionStorage.setItem(appConfig.authSessionKey, JSON.stringify(session));
}

export function clearAuthSession(): void {
  sessionStorage.removeItem(appConfig.authSessionKey);
}

/**
 * 消费统一登录回调并通过 Wedding Coordinator 后端校验令牌。
 * 只有 verify-token 成功后才会落地会话和跳转业务首页。
 */
export async function completeBackendLogin(): Promise<AuthSession | null> {
  const callback = parseAuthCallback(location.hash) ?? parseAuthCallback(location.search);
  if (!callback) return readAuthSession();
  const verified = normalizeVerifyTokenResponse(await authApi.verifyToken(callback.accessToken));
  const session: AuthSession = { ...verified, accessToken: callback.accessToken };
  writeAuthSession(session);
  history.replaceState(null, '', `${location.pathname}#/dashboard`);
  return session;
}

/** 获取后端生成的统一登录地址并跳转。 */
export async function beginBackendLogin(): Promise<never> {
  const redirectUri = `${location.origin}${location.pathname}`;
  const result = await authApi.loginUrl(redirectUri);
  if (!result.loginUrl?.trim()) throw new Error('后端未返回登录地址');
  location.assign(result.loginUrl);
  return new Promise<never>(() => undefined);
}

/** @deprecated 仅保留旧调用兼容；真实登录必须使用 beginBackendLogin。 */
export function consumeAuthCallback(): AuthSession | null {
  return readAuthSession();
}
