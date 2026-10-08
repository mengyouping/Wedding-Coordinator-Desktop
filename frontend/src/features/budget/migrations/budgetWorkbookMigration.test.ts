import { describe, expect, it } from 'vitest';
import { initialWeddingDatabase } from '../../../data/seed';
import { createEmptyWeddingDatabase } from '../../../data/createEmptyWeddingDatabase';
import { migrateBudgetWorkbook } from './budgetWorkbookMigration';

describe('预算工作簿v5迁移', () => {
  it('将演示项目升级为完整Excel预算模板并保持幂等', () => {
    const first = migrateBudgetWorkbook(structuredClone(initialWeddingDatabase));
    const second = migrateBudgetWorkbook(structuredClone(first));

    expect(first.budget.workbookVersion).toBe(5);
    expect(first.budget.categories?.filter(item => item.level === 1)).toHaveLength(9);
    expect(first.budget.parameters).toHaveLength(21);
    expect(first.budget.items).toHaveLength(46);
    expect(first.budget.paymentMilestones).toHaveLength(16);
    expect(first.tasks.filter(item => item.source === 'budget')).toHaveLength(10);
    expect(second.budget.items).toHaveLength(first.budget.items.length);
    expect(second.tasks).toHaveLength(first.tasks.length);
  });

  it('新建项目保留模板但不继承供应商合同流水', () => {
    const owner = initialWeddingDatabase.members[0];
    if (!owner) throw new Error('演示数据缺少项目所有者');
    const created = createEmptyWeddingDatabase(initialWeddingDatabase, 'project-new', '新项目', owner);

    expect(created.budget.items).toHaveLength(46);
    expect(created.tasks.filter(item => item.source === 'budget')).toHaveLength(10);
    expect(created.vendors).toHaveLength(0);
    expect(created.quotes).toHaveLength(0);
    expect(created.contracts).toHaveLength(0);
    expect(created.transactions).toHaveLength(0);
    expect(created.budget.items.every(item => item.actualAmount === 0)).toBe(true);
  });

  it('普通旧项目只迁移自身预算项，不注入演示金额', () => {
    const legacy = structuredClone(initialWeddingDatabase);
    legacy.projectId = 'ordinary-project';
    delete legacy.budget.workbookVersion;
    const migrated = migrateBudgetWorkbook(legacy);

    expect(migrated.budget.items).toHaveLength(legacy.budget.items.length);
    expect(migrated.budget.items.every(item => Boolean(item.categoryId))).toBe(true);
    expect(migrated.budget.paymentMilestones).toHaveLength(0);
  });
});
