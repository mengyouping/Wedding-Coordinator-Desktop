import type { IncidentRecord, TimelineItem } from '../../types/domain';

const toMinutes = (value: string): number => {
  const [hour = 0, minute = 0] = value.split(':').map(Number);
  return hour * 60 + minute;
};

const toTime = (minutes: number): string => {
  const normalized = ((minutes % 1440) + 1440) % 1440;
  return `${String(Math.floor(normalized / 60)).padStart(2, '0')}:${String(normalized % 60).padStart(2, '0')}`;
};

export interface RunbookState {
  current: TimelineItem | null;
  next: TimelineItem | null;
  completed: number;
  remaining: number;
}

export function delayTimeline(items: TimelineItem[], timelineItemId: string, minutes: number): TimelineItem[] {
  if (!Number.isFinite(minutes) || minutes === 0) return items;
  const sorted = [...items].sort((a, b) => a.time.localeCompare(b.time));
  const targetIndex = sorted.findIndex(item => item.id === timelineItemId);
  if (targetIndex < 0) return items;
  const affected = new Set(sorted.slice(targetIndex).filter(item => !item.lockedTime && item.status !== '已完成').map(item => item.id));
  return items.map(item => affected.has(item.id) ? { ...item, time: toTime(toMinutes(item.time) + minutes) } : item);
}

export function currentRunbookState(items: TimelineItem[], currentTime: string): RunbookState {
  const currentMinutes = toMinutes(currentTime);
  const sorted = [...items].sort((a, b) => a.time.localeCompare(b.time));
  const current = sorted.find(item => {
    const start = toMinutes(item.time);
    return start <= currentMinutes && currentMinutes < start + Math.max(1, item.durationMinutes) && item.status !== '已完成';
  }) ?? sorted.filter(item => toMinutes(item.time) <= currentMinutes && item.status !== '已完成').at(-1) ?? null;
  const next = sorted.find(item => toMinutes(item.time) > currentMinutes && item.status !== '已完成') ?? null;
  return {
    current,
    next,
    completed: items.filter(item => item.status === '已完成').length,
    remaining: items.filter(item => item.status !== '已完成').length
  };
}

export function createIncident(input: Pick<IncidentRecord, 'title' | 'level' | 'owner' | 'description' | 'relatedRiskId'>): IncidentRecord {
  return {
    id: crypto.randomUUID(),
    title: input.title.trim(),
    level: input.level,
    status: '处理中',
    owner: input.owner.trim() || '总指挥',
    description: input.description.trim(),
    ...(input.relatedRiskId ? { relatedRiskId: input.relatedRiskId } : {}),
    createdAt: new Date().toISOString()
  };
}
