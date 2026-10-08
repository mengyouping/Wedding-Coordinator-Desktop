import { describe, expect, it } from 'vitest';
import { initialWeddingDatabase } from '../../../data/seed';
import { migrateBudgetWorkbook } from '../migrations/budgetWorkbookMigration';
import { resolveBudgetWorkbook } from './budgetRuleEngine';

describe('预算工作簿规模验证', () => {
  it('能够解析2000条三级预算项目并保持金额有效', () => {
    const database = migrateBudgetWorkbook(structuredClone(initialWeddingDatabase));
    const source = database.budget.items.find(item => item.calculationRule === 'multiply');
    if (!source) throw new Error('缺少可复制的预算项目');
    database.budget.items = Array.from({ length: 2000 }, (_, index) => ({
      ...structuredClone(source),
      id: `budget-scale-${index + 1}`,
      name: `规模预算项${index + 1}`,
      sortOrder: index + 1,
      quantitySource: 'manual' as const,
      unitPriceSource: 'manual' as const,
      quantity: 1,
      unitPrice: index % 100 + 1,
      actualAmount: 0,
      vendorId: '',
      quoteId: '',
      contractId: ''
    }));
    database.transactions = [];
    database.quotes = [];
    database.contracts = [];
    database.vendors = [];

    const resolved = resolveBudgetWorkbook(database);
    expect(resolved.items).toHaveLength(2000);
    expect(resolved.totalPlanned).toBeGreaterThan(0);
    expect(Number.isFinite(resolved.totalPlanned)).toBe(true);
    expect(resolved.categorySummaries.reduce((sum, item) => sum + item.planned, 0)).toBe(resolved.totalPlanned);
  });
});
