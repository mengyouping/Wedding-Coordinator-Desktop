import { describe, expect, it } from 'vitest';
import type { TimelineItem } from '../../types/domain';
import { createIncident, currentRunbookState, delayTimeline } from './runbookEngine';

const items: TimelineItem[] = [
  { id: 'a', time: '10:00', title: '迎宾', owner: '总指挥', location: '门厅', durationMinutes: 30, status: '已完成', dependency: '', note: '', lockedTime: true },
  { id: 'b', time: '10:30', title: '仪式', owner: '主持人', location: '主厅', durationMinutes: 40, status: '已确认', dependency: '', note: '' },
  { id: 'c', time: '11:20', title: '合影', owner: '摄影师', location: '主厅', durationMinutes: 20, status: '待确认', dependency: '', note: '' }
];

describe('runbookEngine', () => {
  it('延迟目标节点时只顺延未锁定且未完成节点', () => {
    const delayed = delayTimeline(items, 'b', 15);
    expect(delayed.find(item => item.id === 'a')?.time).toBe('10:00');
    expect(delayed.find(item => item.id === 'b')?.time).toBe('10:45');
    expect(delayed.find(item => item.id === 'c')?.time).toBe('11:35');
  });

  it('计算当前与下一流程节点', () => {
    const state = currentRunbookState(items, '10:45');
    expect(state.current?.id).toBe('b');
    expect(state.next?.id).toBe('c');
    expect(state.completed).toBe(1);
  });

  it('创建现场异常默认进入处理中', () => {
    expect(createIncident({ title: '车辆晚到', level: '中', owner: '车队负责人', description: '预计晚到十分钟' }).status).toBe('处理中');
  });
});
