import type { WeddingDatabase } from './domain';

/** Spring Boot 后端统一响应包络。 */
export interface ApiEnvelope<T> {
  success: boolean;
  code: number;
  errorCode?: string | null;
  message: string;
  data: T;
  traceId?: string;
}

/** 前端统一可识别的接口异常。 */
export class ApiError extends Error {
  constructor(
    public readonly kind: 'network' | 'timeout' | 'abort' | 'http' | 'business' | 'contract',
    public readonly code: string,
    message: string,
    public readonly retryable: boolean,
    public readonly status?: number,
    public readonly traceId?: string,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export type WeddingSnapshotResponse = ApiEnvelope<WeddingDatabase>;
