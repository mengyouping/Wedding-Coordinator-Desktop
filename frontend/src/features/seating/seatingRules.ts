import type { WeddingTable } from '../../types/domain';

export interface TableAssignmentEvaluation {
  allowed: boolean;
  reason: string;
}

export function evaluateTableAssignment(
  table: WeddingTable,
  usedSeats: number,
  partySize: number
): TableAssignmentEvaluation {
  if (table.status === '已锁定') {
    return { allowed: false, reason: '桌位已锁定，请先解锁后再调整宾客。' };
  }
  if (Math.max(0, usedSeats) + Math.max(1, partySize) > Math.max(1, table.capacity)) {
    return { allowed: false, reason: '安排后将超出桌位容量。' };
  }
  return { allowed: true, reason: '' };
}