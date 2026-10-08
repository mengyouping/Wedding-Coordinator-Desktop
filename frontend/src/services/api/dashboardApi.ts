import type { IncidentRecord, RiskItem, RunbookEvent, TimelineItem, WeddingProfile } from '../../types/domain';
import { toEntityId, type EntityId } from '../../types/persistence';
import { requestJson } from '../http/httpClient';

export interface DashboardView {
  revision: number;
  countdown: { weddingDate: string; daysRemaining: number; timezone: string };
  budget: { plannedAmount: number; actualAmount: number; contractedAmount: number; paidAmount: number; remainingAmount: number };
  tasks: { total: number; completed: number; overdue: number; dueSoon: number };
  guests: { invited: number; attending: number; pending: number; declined: number };
  risks: { highOpen: number; mediumOpen: number };
  nextTimelineItems: TimelineItem[];
  recentActivities: unknown[];
}

export interface WarRoomView {
  projectId: string;
  revision: number;
  timezone: string;
  profile: WeddingProfile;
  timeline: TimelineItem[];
  runbookEvents: RunbookEvent[];
  checkIns: unknown[];
  incidents: IncidentRecord[];
  risks: RiskItem[];
  role: string;
}

function projectPath(projectId: EntityId, suffix: string): string {
  return `/wedding/projects/${encodeURIComponent(toEntityId(projectId, '婚礼项目ID'))}/${suffix}`;
}

export const dashboardApi = {
  get(projectId: EntityId): Promise<DashboardView> {
    return requestJson<DashboardView>(projectPath(projectId, 'dashboard'));
  },
  warRoom(projectId: EntityId): Promise<WarRoomView> {
    return requestJson<WarRoomView>(projectPath(projectId, 'war-room'));
  }
};
