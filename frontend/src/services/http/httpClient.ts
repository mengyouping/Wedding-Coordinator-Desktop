import { appConfig } from '../../config/appConfig';
import { clearAuthSession, readAuthSession } from '../auth/authSession';
import { ApiError, type ApiEnvelope } from '../../types/api';

type ErrorEnvelopeLike = Partial<Pick<ApiEnvelope<unknown>, 'code' | 'errorCode' | 'message' | 'traceId' | 'data'>>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

/** 将后端错误响应稳定转换为前端业务错误码。 */
export function resolveApiErrorCode(body: unknown, status: number): string {
  if (isRecord(body) && typeof body.errorCode === 'string' && body.errorCode.trim()) {
    return body.errorCode.trim();
  }
  return `HTTP_${status}`;
}

function errorMessage(body: unknown, fallback: string): string {
  return isRecord(body) && typeof body.message === 'string' && body.message.trim()
    ? body.message.trim()
    : fallback;
}

function errorTraceId(body: unknown): string | undefined {
  return isRecord(body) && typeof body.traceId === 'string' && body.traceId.trim()
    ? body.traceId.trim()
    : undefined;
}

export async function requestJson<T>(path: string, init: RequestInit = {}): Promise<T> {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), appConfig.apiTimeoutMs);
  const headers = new Headers(init.headers);
  headers.set('Accept', 'application/json');
  if (init.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  if (!headers.has('X-Request-Id')) headers.set('X-Request-Id', crypto.randomUUID());
  const session = readAuthSession();
  if (session && !headers.has('Authorization')) headers.set('Authorization', `Bearer ${session.accessToken}`);

  try {
    const response = await fetch(`${appConfig.apiBaseUrl}${path}`, { ...init, signal: controller.signal, headers });
    const text = await response.text();
    const body = text ? JSON.parse(text) as unknown : null;

    if (response.status === 401) {
      clearAuthSession();
      throw new ApiError(
        'http',
        resolveApiErrorCode(body, 401) === 'HTTP_401' ? 'UNAUTHORIZED' : resolveApiErrorCode(body, 401),
        errorMessage(body, '登录状态已失效，请重新登录'),
        false,
        401,
        errorTraceId(body),
        isRecord(body) ? body.data : undefined
      );
    }

    if (!response.ok) {
      throw new ApiError(
        'http',
        resolveApiErrorCode(body, response.status),
        errorMessage(body, `请求失败：${response.status}`),
        response.status >= 500 || response.status === 429,
        response.status,
        errorTraceId(body),
        isRecord(body) ? body.data : undefined
      );
    }

    if (!isRecord(body)) {
      throw new ApiError('contract', 'INVALID_ENVELOPE', '接口响应不是有效对象', false, response.status);
    }

    const envelope = body as unknown as ApiEnvelope<T>;
    if (typeof envelope.success !== 'boolean' || typeof envelope.code !== 'number' || typeof envelope.message !== 'string') {
      throw new ApiError('contract', 'INVALID_ENVELOPE', '接口响应缺少统一包络字段', false, response.status);
    }
    if (!envelope.success) {
      throw new ApiError(
        'business',
        envelope.errorCode?.trim() || `HTTP_${envelope.code}`,
        envelope.message,
        envelope.code >= 500 || envelope.code === 429,
        response.status,
        envelope.traceId,
        envelope.data
      );
    }
    return envelope.data;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new ApiError('timeout', 'REQUEST_TIMEOUT', '请求超时', true);
    }
    if (error instanceof SyntaxError) throw new ApiError('contract', 'INVALID_JSON', '接口返回的 JSON 无法解析', false);
    throw new ApiError('network', 'NETWORK_ERROR', '无法连接后端服务', true);
  } finally {
    window.clearTimeout(timer);
  }
}
