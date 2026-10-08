import { describe, expect, it } from 'vitest';
import { initialWeddingDatabase } from '../../data/seed';
import { applyFinancialProjection } from './financialProjection';

describe('applyFinancialProjection', () => {
  it('由财务流水统一投影预算实际与供应商已付', () => {
    const database = structuredClone(initialWeddingDatabase);
    database.budget.items = [{
      id: 'budget-1', category: '婚庆', name: '婚庆服务', unit: '项', unitPrice: 1000,
      quantity: 1, quantityMode: 'fixed', includeBuffer: false, actualAmount: 999,
      status: 'confirmed', note: ''
    }];
    database.vendors = [{
      id: 'vendor-1', name: '供应商', category: '婚庆', contactName: '', phone: '', contractAmount: 999,
      paidAmount: 999, nextPaymentDate: '', status: '执行中', rating: 5, riskLevel: '低', note: '',
      payments: [{ id: 'plan-1', title: '计划节点', amount: 800, dueDate: '2026-08-01', status: '已支付', invoiceStatus: '已开票' }]
    }];
    database.quotes = [{ id: 'quote-1', vendorId: 'vendor-1', budgetItemId: 'budget-1', title: '报价', amount: 1000, validUntil: '', selected: true, note: '' }];
    database.contracts = [{ id: 'contract-1', vendorId: 'vendor-1', budgetItemIds: ['budget-1'], title: '合同', amount: 1000, signedAt: '', status: '履约中', attachmentIds: [], note: '' }];
    database.transactions = [
      { id: 'pay', contractId: 'contract-1', budgetItemId: 'budget-1', type: '付款', amount: 500, occurredAt: '2026-07-01', invoiceStatus: '已开票', note: '' },
      { id: 'refund', contractId: 'contract-1', budgetItemId: 'budget-1', type: '退款', amount: 100, occurredAt: '2026-07-02', invoiceStatus: '未开票', note: '' },
      { id: 'adjust', contractId: 'contract-1', budgetItemId: 'budget-1', type: '调整', amount: 20, occurredAt: '2026-07-03', invoiceStatus: '未开票', note: '' }
    ];

    const projected = applyFinancialProjection(database);
    expect(projected.budget.items[0]?.actualAmount).toBe(420);
    expect(projected.budget.items[0]?.quoteId).toBe('quote-1');
    expect(projected.budget.items[0]?.contractId).toBe('contract-1');
    expect(projected.budget.items[0]?.vendorId).toBe('vendor-1');
    expect(projected.vendors[0]?.paidAmount).toBe(420);
    expect(projected.vendors[0]?.contractAmount).toBe(1000);
  });
});
