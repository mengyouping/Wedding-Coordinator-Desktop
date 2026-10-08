import { describe, expect, it } from 'vitest';
import { initialWeddingDatabase } from '../../data/seed';
import { validateDatabase } from '../../services/persistence/databaseValidator';
import { migrateBudgetWorkbook } from './migrations/budgetWorkbookMigration';

describe('预算工作簿引用完整性', () => {
  it('完整模板通过分类参数付款和任务引用校验', () => {
    const database = migrateBudgetWorkbook(structuredClone(initialWeddingDatabase));
    expect(() => validateDatabase(database)).not.toThrow();
  });

  it('预算项引用不存在的二级分类时拒绝保存', () => {
    const database = migrateBudgetWorkbook(structuredClone(initialWeddingDatabase));
    const first = database.budget.items[0];
    if (!first) throw new Error('缺少预算项');
    first.secondaryCategoryId = 'missing-category';
    expect(() => validateDatabase(database)).toThrow(/二级分类/);
  });

  it('付款节点比例超出范围时拒绝保存', () => {
    const database = migrateBudgetWorkbook(structuredClone(initialWeddingDatabase));
    const first = database.budget.paymentMilestones?.[0];
    if (!first) throw new Error('缺少付款节点');
    first.ratio = 1.2;
    expect(() => validateDatabase(database)).toThrow(/比例/);
  });

  it('预算清单引用不存在预算项时拒绝保存', () => {
    const database = migrateBudgetWorkbook(structuredClone(initialWeddingDatabase));
    const task = database.tasks.find(item => item.source === 'budget');
    if (!task) throw new Error('缺少预算清单任务');
    task.budgetItemId = 'missing-budget-item';
    expect(() => validateDatabase(database)).toThrow(/不存在的预算项/);
  });
});
