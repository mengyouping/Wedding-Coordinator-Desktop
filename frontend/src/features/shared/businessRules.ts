import type { Guest, SeatAssignment, TimelineItem, WeddingTable, WeddingTask } from '../../types/domain';

const timeToMinutes = (value: string): number => {
  const [hour = 0, minute = 0] = value.split(':').map(Number);
  return hour * 60 + minute;
};

function dateInTimeZone(value: Date, timeZone: string): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(value);
  const year = parts.find(part => part.type === 'year')?.value ?? '0000';
  const month = parts.find(part => part.type === 'month')?.value ?? '00';
  const day = parts.find(part => part.type === 'day')?.value ?? '00';
  return `${year}-${month}-${day}`;
}

export function isTaskOverdue(task: WeddingTask, now = new Date(), timeZone = 'Asia/Shanghai'): boolean {
  if (!task.dueDate || task.phase === '已完成') return false;
  return task.dueDate < dateInTimeZone(now, timeZone);
}

export interface TimelineConflict {
  firstId: string;
  secondId: string;
  reason: '负责人冲突' | '地点冲突' | '轨道冲突';
}

export function detectTimelineConflicts(items: TimelineItem[]): TimelineConflict[] {
  const sorted = [...items].sort((first, second) => first.time.localeCompare(second.time));
  const conflicts: TimelineConflict[] = [];
  for (let index = 0; index < sorted.length; index += 1) {
    const first = sorted[index];
    if (!first) continue;
    const firstStart = timeToMinutes(first.time);
    const firstEnd = firstStart + Math.max(1, first.durationMinutes);
    for (let nextIndex = index + 1; nextIndex < sorted.length; nextIndex += 1) {
      const second = sorted[nextIndex];
      if (!second) continue;
      const secondStart = timeToMinutes(second.time);
      if (secondStart >= firstEnd) break;
      const secondEnd = secondStart + Math.max(1, second.durationMinutes);
      if (firstStart >= secondEnd) continue;
      const reason = first.owner === second.owner
        ? '负责人冲突'
        : first.location === second.location
          ? '地点冲突'
          : (first.track ?? '主流程') === (second.track ?? '主流程')
            ? '轨道冲突'
            : null;
      if (reason) conflicts.push({ firstId: first.id, secondId: second.id, reason });
    }
  }
  return conflicts;
}

export function autoArrangeGuests(
  guests: Guest[],
  tables: WeddingTable[],
  existingAssignments: SeatAssignment[]
): SeatAssignment[] {
  const confirmed = guests.filter(guest => guest.rsvp === '已确认');
  const guestMap = new Map(guests.map(guest => [guest.id, guest]));
  const tableMap = new Map(tables.map(table => [table.id, table]));
  const lockedTableIds = new Set(tables.filter(table => table.status === '已锁定').map(table => table.id));
  const result = existingAssignments.filter(assignment =>
    lockedTableIds.has(assignment.tableId)
    && guestMap.has(assignment.guestId)
    && tableMap.has(assignment.tableId)
  );
  const assignedGuestIds = new Set(result.map(assignment => assignment.guestId));
  const used = new Map<string, number>();
  for (const assignment of result) {
    const guest = guestMap.get(assignment.guestId);
    used.set(assignment.tableId, (used.get(assignment.tableId) ?? 0) + (guest ? guest.companions + 1 : 0));
  }
  const availableTables = tables.filter(table => table.status !== '已锁定');
  for (const table of availableTables) used.set(table.id, 0);

  const candidates = confirmed
    .filter(guest => !assignedGuestIds.has(guest.id))
    .sort((first, second) => (second.companions + 1) - (first.companions + 1)
      || (first.householdName ?? first.group).localeCompare(second.householdName ?? second.group));

  for (const guest of candidates) {
    const size = guest.companions + 1;
    const target = availableTables.find(table => (used.get(table.id) ?? 0) + size <= table.capacity);
    if (!target) continue;
    result.push({
      id: existingAssignments.find(item => item.guestId === guest.id)?.id ?? `seat-${guest.id}`,
      guestId: guest.id,
      tableId: target.id,
      seatNo: '',
      companionCount: guest.companions
    });
    used.set(target.id, (used.get(target.id) ?? 0) + size);
  }
  return result;
}

export function completedChecklistRate(task: WeddingTask): number {
  const checklist = task.checklist ?? [];
  if (!checklist.length) return task.progress;
  return Math.round(checklist.filter(item => item.done).length / checklist.length * 100);
}
