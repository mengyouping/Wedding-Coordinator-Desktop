import { describe, expect, it } from 'vitest';
import type { Guest, WeddingTable } from '../../types/domain';
import { generateSeatingPlan, scoreSeatingPlan } from './constraintSolver';

const guests: Guest[] = [
  { id: 'g1', name: '甲', side: '共同', group: '朋友', rsvp: '已确认', companions: 1, phone: '', dietary: '', note: '', mustSitWithGuestIds: ['g2'] },
  { id: 'g2', name: '乙', side: '共同', group: '朋友', rsvp: '已确认', companions: 0, phone: '', dietary: '', note: '', mustSitWithGuestIds: ['g1'] },
  { id: 'g3', name: '丙', side: '共同', group: '朋友', rsvp: '已确认', companions: 0, phone: '', dietary: '', note: '', avoidGuestIds: ['g1'] },
  { id: 'g4', name: '丁', side: '共同', group: '长辈', rsvp: '已确认', companions: 0, phone: '', dietary: '', note: '', accessibilityNeed: '轮椅' }
];
const tables: WeddingTable[] = [
  { id: 't1', name: '一号桌', zone: 'A', capacity: 3, shape: '圆桌', status: '编排中', note: '朋友', accessible: false },
  { id: 't2', name: '二号桌', zone: 'B', capacity: 4, shape: '圆桌', status: '编排中', note: '长辈', accessible: true }
];

describe('constraintSolver', () => {
  it('保持必须同桌关系并避开禁止同桌宾客', () => {
    const plan = generateSeatingPlan(guests, tables, []);
    const g1 = plan.assignments.find(item => item.guestId === 'g1');
    const g2 = plan.assignments.find(item => item.guestId === 'g2');
    const g3 = plan.assignments.find(item => item.guestId === 'g3');
    expect(g1?.tableId).toBe(g2?.tableId);
    expect(g3?.tableId).not.toBe(g1?.tableId);
    expect(plan.hardViolations).toHaveLength(0);
  });

  it('无障碍宾客优先进入无障碍桌位', () => {
    const plan = generateSeatingPlan(guests, tables, []);
    expect(plan.assignments.find(item => item.guestId === 'g4')?.tableId).toBe('t2');
  });

  it('评分器报告桌位超员', () => {
    const score = scoreSeatingPlan(guests, tables, [
      { id: 's1', guestId: 'g1', tableId: 't1', seatNo: '', companionCount: 3 },
      { id: 's2', guestId: 'g2', tableId: 't1', seatNo: '', companionCount: 0 }
    ]);
    expect(score.hardViolations.some(item => item.includes('超员'))).toBe(true);
  });
});
