import { describe, expect, it } from 'vitest';
import { zonedDateTimeToEpoch } from './zonedDateTime';

describe('zonedDateTimeToEpoch', () => {
  it('同一当地时间按项目时区生成不同epoch', () => {
    const shanghai = zonedDateTimeToEpoch('2026-08-01', '18:00', 'Asia/Shanghai');
    const tokyo = zonedDateTimeToEpoch('2026-08-01', '18:00', 'Asia/Tokyo');
    expect(shanghai - tokyo).toBe(3_600_000);
  });

  it('无效日期返回NaN', () => {
    expect(Number.isNaN(zonedDateTimeToEpoch('bad-date', '18:00', 'Asia/Shanghai'))).toBe(true);
  });
});
