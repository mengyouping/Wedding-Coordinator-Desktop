import type { Guest, SeatAssignment, SeatingPlan, WeddingDatabase, WeddingTable } from '../../types/domain';
import { toEntityId, type EntityId } from '../../types/persistence';
import { requestJson } from '../http/httpClient';

export interface SeatingAggregateView {
  revision: number;
  activeSeatingPlanId: string;
  tables: WeddingTable[];
  seatAssignments: SeatAssignment[];
  seatingPlans: SeatingPlan[];
}

export interface FinanceSummaryView {
  revision: number;
  plannedAmount: number;
  actualAmount: number;
  contractedAmount: number;
  paidAmount: number;
  refundedAmount: number;
  netPaidAmount: number;
  remainingAmount: number;
}

function base(projectId: EntityId): string {
  return `/wedding/projects/${encodeURIComponent(toEntityId(projectId, '婚礼项目ID'))}`;
}

function headers(revision: number): HeadersInit {
  if (!Number.isSafeInteger(revision) || revision < 1) throw new Error('Revision必须为正整数');
  return { 'If-Match': String(revision), 'Idempotency-Key': crypto.randomUUID() };
}

export const additionalBusinessApi = {
  transferOwner(projectId: EntityId, targetMemberId: EntityId, revision: number): Promise<WeddingDatabase> {
    return requestJson<WeddingDatabase>(`${base(projectId)}/owner-transfer`, {
      method: 'POST', headers: headers(revision), body: JSON.stringify({ targetMemberId })
    });
  },

  guestRsvp(
    projectId: EntityId,
    guestId: EntityId,
    revision: number,
    body: { attending: boolean; companions: number; dietary: string; note: string }
  ): Promise<WeddingDatabase> {
    return requestJson<WeddingDatabase>(`${base(projectId)}/guests/${encodeURIComponent(toEntityId(guestId, '宾客ID'))}/rsvp`, {
      method: 'POST', headers: headers(revision), body: JSON.stringify(body)
    });
  },

  importGuests(projectId: EntityId, revision: number, guests: Partial<Guest>[]): Promise<WeddingDatabase> {
    return requestJson<WeddingDatabase>(`${base(projectId)}/guests/import`, {
      method: 'POST', headers: headers(revision), body: JSON.stringify(guests)
    });
  },

  async exportGuests(projectId: EntityId): Promise<Blob> {
    const response = await fetch(`${base(projectId)}/guests/export`, {
      headers: { Accept: 'text/csv' },
      credentials: 'same-origin'
    });
    if (!response.ok) throw new Error(`宾客导出失败：HTTP ${response.status}`);
    return response.blob();
  },

  seating(projectId: EntityId): Promise<SeatingAggregateView> {
    return requestJson<SeatingAggregateView>(`${base(projectId)}/seating`);
  },

  financeSummary(projectId: EntityId): Promise<FinanceSummaryView> {
    return requestJson<FinanceSummaryView>(`${base(projectId)}/finance/summary`);
  }
};
