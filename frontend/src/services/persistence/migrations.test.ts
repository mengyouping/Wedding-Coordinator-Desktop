import { describe, expect, it } from 'vitest';
import { migrateDatabase } from './migrations';

const legacy = {
  schemaVersion: 2,
  projectId: 'legacy-project',
  updatedAt: '2030-07-01T00:00:00.000Z',
  profile: {
    groomName: '示例新郎', brideName: '示例新娘', weddingDate: '2030-10-18',
    ceremonyTime: '18:18', banquetTime: '19:08', venueName: '测试酒店',
    venueAddress: '示例城市', coordinatorName: '总指挥', phone: ''
  },
  budget: { params: { guestCount: 10, tableCount: 1, seatsPerTable: 10, bufferRate: 0.1, weddingDays: 1, totalBudgetCap: 10000 }, items: [] },
  tasks: [],
  guests: [{ id: 'g1', name: '宾客', side: '共同', group: '朋友', rsvp: '已确认', companions: 0, phone: '', tableId: 't1', dietary: '', note: '' }],
  tables: [{ id: 't1', name: '一号桌', zone: '主厅', capacity: 10, guestIds: ['g1'], shape: '圆桌', status: '编排中', note: '' }],
  vendors: [], timeline: [], invitations: [], risks: [], materials: []
};

describe('migrateDatabase', () => {
  it('将Schema v2迁移为v4并统一排桌关系', () => {
    const result = migrateDatabase(legacy);
    expect(result.schemaVersion).toBe(4);
    expect(result.revision).toBe(1);
    expect(result.seatAssignments).toHaveLength(1);
    expect(result.seatingPlans).toHaveLength(1);
    expect(result.seatAssignments[0]).toMatchObject({ guestId: 'g1', tableId: 't1' });
    expect('tableId' in result.guests[0]!).toBe(false);
    expect('guestIds' in result.tables[0]!).toBe(false);
    expect(result.attachments).toEqual([]);
    expect(result.outbox).toEqual([]);
    expect(result.settings.maskSensitiveByDefault).toBe(true);
  });

  it('保留v3数据并补齐生产化集合', () => {
    const result = migrateDatabase({ ...legacy, schemaVersion: 3, seatAssignments: [{ id: 's1', guestId: 'g1', tableId: 't1', seatNo: '1', companionCount: 0 }] });
    expect(result.schemaVersion).toBe(4);
    expect(result.conflicts).toEqual([]);
    expect(result.transactions).toEqual([]);
    expect(result.runbookEvents).toEqual([]);
  });
});
