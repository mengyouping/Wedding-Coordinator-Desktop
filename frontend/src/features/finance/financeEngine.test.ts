import { describe, expect, it } from 'vitest';
import { initialWeddingDatabase } from '../../data/seed';
import { migrateDatabase } from '../../services/persistence/migrations';
import { financeWarnings, summarizeFinance } from './financeEngine';

function database() {
  const value = migrateDatabase(initialWeddingDatabase);
  value.quotes = [{ id: 'q1', vendorId: 'v1', budgetItemId: 'b1', title: '酒店报价', amount: 88000, validUntil: '2026-08-01', selected: true, note: '' }];
  value.contracts = [{ id: 'c1', vendorId: 'v1', budgetItemIds: ['b1'], title: '酒店合同', amount: 90000, signedAt: '2026-07-01', status: '履约中', attachmentIds: [], note: '' }];
  value.transactions = [
    { id: 'tx1', contractId: 'c1', vendorId: 'v1', budgetItemId: 'b1', type: '付款', amount: 30000, occurredAt: '2026-07-02', invoiceStatus: '已开票', note: '' },
    { id: 'tx2', contractId: 'c1', vendorId: 'v1', budgetItemId: 'b1', type: '退款', amount: 2000, occurredAt: '2026-07-03', invoiceStatus: '未开票', note: '' }
  ];
  return value;
}

describe('financeEngine', () => {
  it('统一汇总报价合同付款退款和开票', () => {
    const summary = summarizeFinance(database());
    expect(summary.selectedQuotes).toBe(88000);
    expect(summary.contractValue).toBe(90000);
    expect(summary.netPaid).toBe(28000);
    expect(summary.invoiced).toBe(30000);
    expect(summary.outstanding).toBe(62000);
  });

  it('检测同一预算项选中多份报价', () => {
    const value = database();
    value.quotes.push({ ...value.quotes[0]!, id: 'q2' });
    expect(financeWarnings(value).some(item => item.includes('选中了 2 份报价'))).toBe(true);
  });
});
