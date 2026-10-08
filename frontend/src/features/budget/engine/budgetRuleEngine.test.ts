import { describe, expect, it } from 'vitest';
import { initialWeddingDatabase } from '../../../data/seed';
import { migrateBudgetWorkbook } from '../migrations/budgetWorkbookMigration';
import { resolveBudgetWorkbook } from './budgetRuleEngine';

describe('预算工作簿规则引擎', () => {
  it('按Excel规则联动桌数、伴手礼、服务费、风险预留和总额', () => {
    const database = migrateBudgetWorkbook(structuredClone(initialWeddingDatabase));
    const resolved = resolveBudgetWorkbook(database);

    expect(resolved.parameterMap.get('guest.invitedCount')).toBe(280);
    expect(resolved.parameterMap.get('table.mainCount')).toBe(30);
    expect(resolved.parameterMap.get('table.totalCount')).toBe(32);
    expect(resolved.parameterMap.get('guest.giftCount')).toBe(294);

    const mainTable = resolved.items.find(item => item.name === '婚宴正桌');
    const backupTable = resolved.items.find(item => item.name === '备用桌');
    const service = resolved.items.find(item => item.name === '服务费');
    const gifts = resolved.items.find(item => item.name === '婚礼伴手礼');
    const reserve = resolved.items.find(item => item.calculationRule === 'riskReserve');

    expect(mainTable?.budgetAmount).toBe(15000);
    expect(backupTable?.budgetAmount).toBe(1000);
    expect(service?.budgetAmount).toBe(1600);
    expect(gifts?.resolvedQuantity).toBe(294);
    expect(gifts?.budgetAmount).toBe(2940);
    expect(reserve?.budgetAmount).toBe(8444);
    expect(resolved.totalPlanned).toBe(92884);
    expect(reserve?.formulaDescription).toContain('风险预留比例');
  });

  it('可选项关闭后自动归零，手工项目仍可计算', () => {
    const database = migrateBudgetWorkbook(structuredClone(initialWeddingDatabase));
    const ringToggle = database.budget.parameters?.find(item => item.key === 'optional.ring');
    if (!ringToggle) throw new Error('缺少婚戒开关参数');
    ringToggle.value = false;

    const resolved = resolveBudgetWorkbook(database);
    const ring = resolved.items.find(item => item.name === '婚戒');
    const photo = resolved.items.find(item => item.name === '婚纱照');

    expect(ring?.includedResolved).toBe(false);
    expect(ring?.budgetAmount).toBe(0);
    expect(photo?.includedResolved).toBe(true);
    expect(photo?.budgetAmount).toBe(6000);
  });

  it('财务流水继续作为实际支出的唯一事实源', () => {
    const database = migrateBudgetWorkbook(structuredClone(initialWeddingDatabase));
    const target = database.budget.items.find(item => item.name === '婚宴正桌');
    if (!target) throw new Error('缺少婚宴正桌预算项');
    database.transactions.push({
      id: 'transaction-rule-test',
      budgetItemId: target.id,
      vendorId: target.vendorId ?? '',
      contractId: target.contractId ?? '',
      type: '付款',
      amount: 1234,
      occurredAt: '2026-07-26',
      invoiceStatus: '未开票',
      note: '规则引擎测试'
    });

    const resolved = resolveBudgetWorkbook(database);
    const row = resolved.items.find(item => item.id === target.id);
    expect(row?.actualAmount).toBeGreaterThanOrEqual(1234);
    expect(row?.paidAmount).toBe(row?.actualAmount);
  });
});
