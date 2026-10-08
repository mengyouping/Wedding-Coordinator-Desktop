import { describe, expect, it } from 'vitest';
import { initialWeddingDatabase } from '../../data/seed';
import { inferDatabaseMutationPermissions } from './databaseMutationPermission';

describe('inferDatabaseMutationPermissions', () => {
  it('现场流程更新只需要执行权限', () => {
    const next = structuredClone(initialWeddingDatabase);
    next.timeline = next.timeline.map(item => ({ ...item, status: '已完成' }));
    expect(inferDatabaseMutationPermissions(initialWeddingDatabase, next)).toEqual(['execution.write']);
  });

  it('财务投影更新预算供应商合同流水只需要预算权限', () => {
    const next = structuredClone(initialWeddingDatabase);
    next.transactions = [...next.transactions, { id: 'new', type: '付款', amount: 1, occurredAt: '', invoiceStatus: '未开票', note: '' }];
    next.vendors = next.vendors.map(item => ({ ...item, paidAmount: item.paidAmount + 1 }));
    next.budget = { ...next.budget, items: next.budget.items.map(item => ({ ...item, actualAmount: item.actualAmount + 1 })) };
    expect(inferDatabaseMutationPermissions(initialWeddingDatabase, next)).toEqual(['budget.write']);
  });

  it('宾客与排桌原子更新需要两个领域权限', () => {
    const next = structuredClone(initialWeddingDatabase);
    next.guests = next.guests.slice(1);
    next.seatAssignments = next.seatAssignments.slice(1);
    expect(inferDatabaseMutationPermissions(initialWeddingDatabase, next)).toEqual(['guest.write', 'seating.write']);
  });
});
