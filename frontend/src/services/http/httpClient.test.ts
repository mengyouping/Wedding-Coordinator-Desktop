import { describe, expect, it } from 'vitest';
import { resolveApiErrorCode } from './httpClient';

describe('httpClient response envelope', () => {
  it('优先使用后端稳定errorCode', () => {
    expect(resolveApiErrorCode({ code: 409, errorCode: 'VERSION_CONFLICT' }, 409)).toBe('VERSION_CONFLICT');
  });

  it('后端没有errorCode时回退HTTP状态码', () => {
    expect(resolveApiErrorCode({ code: 422, errorCode: null }, 422)).toBe('HTTP_422');
  });

  it('无响应体时仍返回稳定HTTP错误码', () => {
    expect(resolveApiErrorCode(null, 500)).toBe('HTTP_500');
  });
});
