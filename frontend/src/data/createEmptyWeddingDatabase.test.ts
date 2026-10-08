import { describe, expect, it } from 'vitest';
import { initialWeddingDatabase } from './seed';
import { createEmptyWeddingDatabase } from './createEmptyWeddingDatabase';

const emptyOperationalCollections = [
  'guests', 'tables', 'seatAssignments', 'seatingPlans', 'vendors', 'timeline',
  'invitations', 'risks', 'materials', 'attachments', 'quotes', 'contracts', 'transactions',
  'runbookEvents', 'checkIns', 'incidents', 'conflicts', 'outbox', 'auditLogs'
] as const;

describe('createEmptyWeddingDatabase', () => {
  it('创建项目时不继承演示业务数据，但保留预算与总指挥模板', () => {
    const created = createEmptyWeddingDatabase(initialWeddingDatabase, 'project-new', '新婚礼项目', {
      id: 'owner', name: '本地所有者', email: '', role: '所有者', active: true
    });
    for (const key of emptyOperationalCollections) expect(created[key], key).toEqual([]);
    expect(created.budget.workbookVersion).toBe(5);
    expect(created.budget.categories?.filter(item => item.level === 1)).toHaveLength(9);
    expect(created.budget.parameters).toHaveLength(21);
    expect(created.budget.items).toHaveLength(46);
    expect(created.budget.items.every(item => item.actualAmount === 0)).toBe(true);
    expect(created.tasks.filter(item => item.source === 'budget')).toHaveLength(10);
    expect(created.settings.projectName).toBe('新婚礼项目');
    expect(created.profile.groomName).toBe('新郎');
    expect(created.profile.brideName).toBe('新娘');
  });
});
