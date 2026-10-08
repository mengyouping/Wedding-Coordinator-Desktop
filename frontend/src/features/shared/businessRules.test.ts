import { describe, expect, it } from 'vitest';
import { autoArrangeGuests, detectTimelineConflicts, isTaskOverdue } from './businessRules';
import type { Guest, SeatAssignment, TimelineItem, WeddingTable, WeddingTask } from '../../types/domain';

const guests: Guest[] = [
  { id: 'g1', name: '甲家庭', side: '共同', group: '朋友', rsvp: '已确认', companions: 2, phone: '', dietary: '', note: '' },
  { id: 'g2', name: '乙', side: '共同', group: '朋友', rsvp: '已确认', companions: 0, phone: '', dietary: '', note: '' }
];
const tables: WeddingTable[] = [
  { id: 't1', name: '一号桌', zone: '主厅', capacity: 3, shape: '圆桌', status: '编排中', note: '' },
  { id: 't2', name: '二号桌', zone: '主厅', capacity: 10, shape: '圆桌', status: '编排中', note: '' }
];

describe('autoArrangeGuests', () => {
  it('按家庭人数和桌位容量自动排桌', () => {
    const result = autoArrangeGuests(guests, tables, []);
    expect(result).toHaveLength(2);
    expect(result.find(item => item.guestId === 'g1')?.tableId).toBe('t1');
    expect(result.find(item => item.guestId === 'g2')?.tableId).toBe('t2');
  });

  it('保留已锁定桌的现有安排', () => {
    const locked = [{ ...tables[0]!, status: '已锁定' as const }, tables[1]!];
    const existing: SeatAssignment[] = [{ id: 's1', guestId: 'g1', tableId: 't1', seatNo: '', companionCount: 2 }];
    expect(autoArrangeGuests(guests, locked, existing).find(item => item.guestId === 'g1')).toEqual(existing[0]);
  });
});

describe('detectTimelineConflicts', () => {
  it('识别同负责人在重叠时间的跨轨道冲突', () => {
    const items: TimelineItem[] = [
      { id: 'r1', time: '10:00', title: '甲', owner: '总指挥', location: 'A厅', durationMinutes: 60, status: '待确认', dependency: '', note: '', track: '主流程' },
      { id: 'r2', time: '10:30', title: '乙', owner: '总指挥', location: 'B厅', durationMinutes: 30, status: '待确认', dependency: '', note: '', track: '宾客线' }
    ];
    expect(detectTimelineConflicts(items)).toEqual([{ firstId: 'r1', secondId: 'r2', reason: '负责人冲突' }]);
  });
});

describe('isTaskOverdue', () => {
  it('未完成且截止日期早于当天时判定逾期', () => {
    const task: WeddingTask = { id: 't1', title: '任务', description: '', owner: '总指挥', phase: '进行中', priority: 'P0', dueDate: '2026-07-20', category: '综合', progress: 20 };
    expect(isTaskOverdue(task, new Date('2026-07-21T00:00:00+08:00'))).toBe(true);
  });
});
