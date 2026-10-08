import { describe, expect, it } from 'vitest';
import type { WeddingTable } from '../../types/domain';
import { evaluateTableAssignment } from './seatingRules';

const table: WeddingTable = {
  id: 'table-1', name: '主桌', zone: '主厅', capacity: 10, shape: '圆桌', status: '空闲', note: ''
};

describe('桌位安排规则', () => {
  it('锁定桌位禁止新增或移除安排', () => {
    expect(evaluateTableAssignment({ ...table, status: '已锁定' }, 2, 1)).toEqual({
      allowed: false,
      reason: '桌位已锁定，请先解锁后再调整宾客。'
    });
  });

  it('超出桌位容量时拒绝安排', () => {
    expect(evaluateTableAssignment(table, 9, 2)).toEqual({
      allowed: false,
      reason: '安排后将超出桌位容量。'
    });
  });

  it('未锁定且容量充足时允许安排', () => {
    expect(evaluateTableAssignment(table, 7, 3)).toEqual({ allowed: true, reason: '' });
  });
});