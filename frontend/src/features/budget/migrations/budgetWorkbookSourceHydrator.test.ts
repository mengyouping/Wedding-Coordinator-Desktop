import { describe, expect, it } from 'vitest';
import { initialWeddingDatabase } from '../../../data/seed';
import { migrateDatabase } from '../../../services/persistence/migrations';
import { migrateBudgetWorkbook } from './budgetWorkbookMigration';
import { hydrateBudgetWorkbookSource } from './budgetWorkbookSourceHydrator';

describe('预算工作簿源字段恢复', () => {
  it('通用根迁移后保留分类参数付款和预算项目扩展字段', () => {
    const source = migrateBudgetWorkbook(structuredClone(initialWeddingDatabase));
    const parameter = source.budget.parameters?.find(item => item.key === 'hotel.banquetUnitPrice');
    const item = source.budget.items.find(row => row.name === '婚宴正桌');
    const milestone = source.budget.paymentMilestones?.[0];
    const task = source.tasks.find(row => row.source === 'budget');
    if (!parameter || !item || !milestone || !task) throw new Error('预算工作簿测试数据不完整');

    parameter.value = 6888;
    item.acceptanceCriteria = '测试验收标准';
    item.collaboratorMemberIds = ['member-1'];
    milestone.ownerName = '测试负责人';
    task.collaborators = ['协同甲', '协同乙'];
    task.stageCode = 'T-20日';

    const generic = migrateDatabase(JSON.parse(JSON.stringify(source)) as unknown);
    const hydrated = hydrateBudgetWorkbookSource(JSON.parse(JSON.stringify(source)) as unknown, generic);

    expect(hydrated.budget.workbookVersion).toBe(5);
    expect(hydrated.budget.parameters?.find(row => row.key === 'hotel.banquetUnitPrice')?.value).toBe(6888);
    expect(hydrated.budget.items.find(row => row.id === item.id)?.acceptanceCriteria).toBe('测试验收标准');
    expect(hydrated.budget.items.find(row => row.id === item.id)?.collaboratorMemberIds).toEqual(['member-1']);
    expect(hydrated.budget.paymentMilestones?.[0]?.ownerName).toBe('测试负责人');
    expect(hydrated.tasks.find(row => row.id === task.id)?.collaborators).toEqual(['协同甲', '协同乙']);
    expect(hydrated.tasks.find(row => row.id === task.id)?.stageCode).toBe('T-20日');
  });
});
