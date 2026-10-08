import { describe, expect, it } from 'vitest';
import {
  toDatabaseBoolean,
  toDecimalNumber,
  toDomainBoolean,
  toEntityId,
  toExternalUserId,
  toIntegerNumber
} from './persistence';

describe('前端持久化字段类型转换', () => {
  it('数据库布尔值与领域布尔值双向转换', () => {
    expect(toDomainBoolean(1)).toBe(true);
    expect(toDomainBoolean(0)).toBe(false);
    expect(toDomainBoolean(true)).toBe(true);
    expect(toDatabaseBoolean(true)).toBe(1);
    expect(toDatabaseBoolean(false)).toBe(0);
  });

  it('DECIMAL 字符串在 API 边界转换为有限数字', () => {
    expect(toDecimalNumber('123456.780000', '合同金额')).toBe(123456.78);
    expect(toDecimalNumber(0, '合同金额')).toBe(0);
    expect(() => toDecimalNumber('not-a-number', '合同金额')).toThrow(/合同金额/);
    expect(() => toDecimalNumber(Number.POSITIVE_INFINITY, '合同金额')).toThrow(/有限数字/);
  });

  it('整数字段拒绝小数和超出安全范围的值', () => {
    expect(toIntegerNumber('18', '宾客人数')).toBe(18);
    expect(() => toIntegerNumber('1.5', '宾客人数')).toThrow(/安全整数/);
    expect(() => toIntegerNumber(Number.MAX_SAFE_INTEGER + 1, '宾客人数')).toThrow(/安全整数/);
  });

  it('实体ID严格匹配VARCHAR(64)长度', () => {
    expect(toEntityId('project/with space', '婚礼项目ID')).toBe('project/with space');
    expect(toEntityId('项'.repeat(64), '婚礼项目ID')).toHaveLength(64);
    expect(() => toEntityId('  ', '婚礼项目ID')).toThrow(/不能为空/);
    expect(() => toEntityId('项'.repeat(65), '婚礼项目ID')).toThrow(/不能超过64个字符/);
  });

  it('ADABAS统一用户ID严格匹配VARCHAR(128)长度', () => {
    expect(toExternalUserId('user_001')).toBe('user_001');
    expect(() => toExternalUserId('')).toThrow(/不能为空/);
    expect(() => toExternalUserId('u'.repeat(129))).toThrow(/不能超过128个字符/);
  });
});
