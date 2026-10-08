import { describe, expect, it } from 'vitest';
import { validateDatabase } from './databaseValidator';
import type { WeddingDatabase } from '../../types/domain';

const base: WeddingDatabase = {
  schemaVersion: 4,
  projectId: 'p1',
  revision: 1,
  updatedAt: '2030-07-01T00:00:00.000Z',
  settings: {
    projectName: '测试婚礼', status: '筹备中', timezone: 'Asia/Shanghai', currency: 'CNY',
    locale: 'zh-CN', archived: false, autoLockMinutes: 15, maskSensitiveByDefault: true
  },
  profile: {
    groomName: '示例新郎', brideName: '示例新娘', weddingDate: '2030-10-18', ceremonyTime: '18:18',
    banquetTime: '19:08', venueName: '测试酒店', venueAddress: '示例城市', coordinatorName: '总指挥', phone: ''
  },
  members: [],
  budget: { params: { guestCount: 10, tableCount: 1, seatsPerTable: 10, bufferRate: 0.1, weddingDays: 1, totalBudgetCap: 10000 }, items: [] },
  tasks: [],
  guests: [{
    id: 'g1', name: '宾客', side: '共同', group: '朋友', rsvp: '已确认', companions: 0,
    phone: '', dietary: '', note: '', preferredTableIds: [], mustSitWithGuestIds: [], avoidGuestIds: []
  }],
  tables: [{ id: 't1', name: '一号桌', zone: '主厅', capacity: 10, shape: '圆桌', status: '编排中', note: '', rotation: 0 }],
  seatAssignments: [{ id: 's1', guestId: 'g1', tableId: 't1', seatNo: '', companionCount: 0 }],
  seatingPlans: [],
  vendors: [], timeline: [], invitations: [], risks: [], materials: [], attachments: [], quotes: [], contracts: [], transactions: [],
  runbookEvents: [], checkIns: [], incidents: [], conflicts: [], outbox: [], auditLogs: []
};

describe('validateDatabase', () => {
  it('接受完整Schema v4数据', () => {
    expect(validateDatabase(structuredClone(base)).schemaVersion).toBe(4);
  });

  it('拒绝引用不存在桌位的排桌记录', () => {
    const invalid = { ...base, seatAssignments: [{ ...base.seatAssignments[0]!, tableId: 'missing' }] };
    expect(() => validateDatabase(invalid)).toThrow('不存在的桌位');
  });

  it('拒绝同一宾客重复排桌', () => {
    const invalid = { ...base, seatAssignments: [...base.seatAssignments, { id: 's2', guestId: 'g1', tableId: 't1', seatNo: '2', companionCount: 0 }] };
    expect(() => validateDatabase(invalid)).toThrow('重复排桌');
  });

  it('拒绝任务循环依赖', () => {
    const invalid: WeddingDatabase = {
      ...base,
      tasks: [
        { id: 'a', title: 'A', description: '', owner: '', phase: '待启动', priority: 'P1', dueDate: '', category: '', progress: 0, dependencyIds: ['b'] },
        { id: 'b', title: 'B', description: '', owner: '', phase: '待启动', priority: 'P1', dueDate: '', category: '', progress: 0, dependencyIds: ['a'] }
      ]
    };
    expect(() => validateDatabase(invalid)).toThrow('循环');
  });

  it('拒绝超过50MB的附件', () => {
    const invalid: WeddingDatabase = {
      ...base,
      attachments: [{
        id: 'a1', entityType: 'project', entityId: 'p1', fileName: 'large.zip', mimeType: 'application/zip',
        size: 51 * 1024 * 1024, storageKey: 'large.zip', hash: 'abc', uploadedBy: '总指挥', uploadedAt: new Date().toISOString(), visibility: '项目成员'
      }]
    };
    expect(() => validateDatabase(invalid)).toThrow('50MB');
  });
});
