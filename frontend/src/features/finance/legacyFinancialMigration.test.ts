import { describe, expect, it } from 'vitest';
import { initialWeddingDatabase } from '../../data/seed';
import { migrateLegacyFinancialFacts } from './legacyFinancialMigration';

describe('migrateLegacyFinancialFacts', () => {
  it('把只有供应商付款节点的历史金额转成合同与交易事实', () => {
    const database = structuredClone(initialWeddingDatabase);
    database.contracts = database.contracts.filter(item => item.vendorId !== 'v3');
    database.transactions = database.transactions.filter(item => item.vendorId !== 'v3');
    const migrated = migrateLegacyFinancialFacts(database);
    expect(migrated.contracts.some(item => item.vendorId === 'v3' && item.amount === 1200)).toBe(true);
    expect(migrated.transactions.some(item => item.vendorId === 'v3' && item.amount === 100)).toBe(true);
  });

  it('把没有中央流水的已支付预算实际额转成历史付款', () => {
    const database = structuredClone(initialWeddingDatabase);
    database.transactions = database.transactions.filter(item => item.budgetItemId !== 'b4');
    const migrated = migrateLegacyFinancialFacts(database);
    expect(migrated.transactions.some(item => item.budgetItemId === 'b4' && item.amount === 50)).toBe(true);
  });

  it('重复迁移不会生成重复合同与流水', () => {
    const first = migrateLegacyFinancialFacts(structuredClone(initialWeddingDatabase));
    const second = migrateLegacyFinancialFacts(first);
    expect(second.contracts.map(item => item.id)).toEqual(first.contracts.map(item => item.id));
    expect(second.transactions.map(item => item.id)).toEqual(first.transactions.map(item => item.id));
  });
});
