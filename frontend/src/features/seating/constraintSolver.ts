import type { Guest, SeatAssignment, SeatingPlan, WeddingTable } from '../../types/domain';

function partySize(guest: Guest): number {
  return 1 + Math.max(0, guest.companions);
}

function groupGuests(guests: Guest[]): Guest[][] {
  const byId = new Map(guests.map(guest => [guest.id, guest]));
  const visited = new Set<string>();
  const groups: Guest[][] = [];
  for (const guest of guests) {
    if (visited.has(guest.id)) continue;
    const stack = [guest.id];
    const group: Guest[] = [];
    while (stack.length) {
      const id = stack.pop()!;
      if (visited.has(id)) continue;
      visited.add(id);
      const current = byId.get(id);
      if (!current) continue;
      group.push(current);
      for (const related of current.mustSitWithGuestIds ?? []) if (!visited.has(related)) stack.push(related);
      for (const candidate of guests) if ((candidate.mustSitWithGuestIds ?? []).includes(id) && !visited.has(candidate.id)) stack.push(candidate.id);
    }
    groups.push(group);
  }
  return groups.sort((first, second) => second.reduce((sum, guest) => sum + partySize(guest), 0) - first.reduce((sum, guest) => sum + partySize(guest), 0));
}

function occupants(assignments: SeatAssignment[], tableId: string): number {
  return assignments.filter(item => item.tableId === tableId).reduce((sum, item) => sum + 1 + Math.max(0, item.companionCount), 0);
}

function tableGuests(assignments: SeatAssignment[], tableId: string): string[] {
  return assignments.filter(item => item.tableId === tableId).map(item => item.guestId);
}

function avoidConflict(group: Guest[], currentGuestIds: string[], guestsById: Map<string, Guest>): boolean {
  const groupIds = new Set(group.map(item => item.id));
  return group.some(guest => (guest.avoidGuestIds ?? []).some(id => groupIds.has(id) || currentGuestIds.includes(id)))
    || currentGuestIds.some(id => (guestsById.get(id)?.avoidGuestIds ?? []).some(avoidId => groupIds.has(avoidId)));
}

function candidateScore(group: Guest[], table: WeddingTable): number {
  let score = 0;
  if (group.some(guest => guest.accessibilityNeed?.trim()) && table.accessible) score += 30;
  for (const guest of group) {
    if ((guest.preferredTableIds ?? []).includes(table.id)) score += 20;
    if (guest.group && table.note.includes(guest.group)) score += 4;
    if (guest.side && table.note.includes(guest.side)) score += 3;
  }
  return score;
}

export interface SeatingScore {
  score: number;
  hardViolations: string[];
  explanations: string[];
}

export function scoreSeatingPlan(guests: Guest[], tables: WeddingTable[], assignments: SeatAssignment[]): SeatingScore {
  const guestById = new Map(guests.map(item => [item.id, item]));
  const tableById = new Map(tables.map(item => [item.id, item]));
  const hardViolations: string[] = [];
  const explanations: string[] = [];
  const assigned = new Set<string>();
  let score = 100;

  for (const assignment of assignments) {
    if (assigned.has(assignment.guestId)) hardViolations.push(`宾客 ${assignment.guestId} 被重复安排`);
    assigned.add(assignment.guestId);
    if (!guestById.has(assignment.guestId)) hardViolations.push(`安排引用不存在的宾客 ${assignment.guestId}`);
    if (!tableById.has(assignment.tableId)) hardViolations.push(`安排引用不存在的桌位 ${assignment.tableId}`);
  }
  for (const table of tables) {
    const used = occupants(assignments, table.id);
    if (used > table.capacity) hardViolations.push(`${table.name} 超员 ${used - table.capacity} 人`);
  }
  for (const guest of guests) {
    const assignment = assignments.find(item => item.guestId === guest.id);
    if (!assignment && guest.rsvp === '已确认') {
      hardViolations.push(`${guest.name} 尚未排桌`);
      continue;
    }
    if (!assignment) continue;
    const sameTable = tableGuests(assignments, assignment.tableId);
    for (const id of guest.mustSitWithGuestIds ?? []) if (!sameTable.includes(id)) hardViolations.push(`${guest.name} 未与指定宾客同桌`);
    for (const id of guest.avoidGuestIds ?? []) if (sameTable.includes(id)) hardViolations.push(`${guest.name} 与避让宾客同桌`);
    const table = tableById.get(assignment.tableId);
    if (guest.accessibilityNeed?.trim() && !table?.accessible) {
      score -= 12;
      explanations.push(`${guest.name} 有无障碍需求，但当前桌位未标记无障碍`);
    }
    if ((guest.preferredTableIds ?? []).includes(assignment.tableId)) {
      score += 3;
      explanations.push(`${guest.name} 已安排到偏好桌位`);
    }
  }
  score -= hardViolations.length * 25;
  return { score: Math.max(0, Math.min(100, score)), hardViolations, explanations };
}

export function generateSeatingPlan(
  guests: Guest[],
  tables: WeddingTable[],
  existing: SeatAssignment[],
  name = `自动方案 ${new Date().toLocaleString()}`
): SeatingPlan {
  const confirmed = guests.filter(item => item.rsvp === '已确认');
  const guestsById = new Map(confirmed.map(item => [item.id, item]));
  const lockedTableIds = new Set(tables.filter(item => item.status === '已锁定').map(item => item.id));
  const assignments = existing.filter(item => lockedTableIds.has(item.tableId) && guestsById.has(item.guestId)).map(item => ({ ...item }));
  const alreadyAssigned = new Set(assignments.map(item => item.guestId));

  for (const group of groupGuests(confirmed).filter(group => group.some(guest => !alreadyAssigned.has(guest.id)))) {
    const pendingGroup = group.filter(guest => !alreadyAssigned.has(guest.id));
    const size = pendingGroup.reduce((sum, guest) => sum + partySize(guest), 0);
    const candidates = tables
      .filter(table => table.status !== '已锁定')
      .filter(table => table.capacity - occupants(assignments, table.id) >= size)
      .filter(table => !avoidConflict(pendingGroup, tableGuests(assignments, table.id), guestsById))
      .sort((first, second) => candidateScore(pendingGroup, second) - candidateScore(pendingGroup, first)
        || (first.capacity - occupants(assignments, first.id)) - (second.capacity - occupants(assignments, second.id)));
    const selected = candidates[0];
    if (!selected) continue;
    let seat = occupants(assignments, selected.id) + 1;
    for (const guest of pendingGroup) {
      assignments.push({
        id: `seat-${guest.id}-${selected.id}`,
        guestId: guest.id,
        tableId: selected.id,
        seatNo: guest.companions ? `${seat}-${seat + guest.companions}` : String(seat),
        companionCount: guest.companions
      });
      seat += partySize(guest);
      alreadyAssigned.add(guest.id);
    }
  }

  const result = scoreSeatingPlan(confirmed, tables, assignments);
  return {
    id: crypto.randomUUID(),
    name,
    active: false,
    score: result.score,
    hardViolations: result.hardViolations,
    explanations: result.explanations.length ? result.explanations : ['方案优先满足容量、锁定桌、同桌、避让和无障碍约束。'],
    assignments,
    createdAt: new Date().toISOString()
  };
}
