import { createDefaultBudgetWorkbook } from '../features/budget/data';
import type { ProjectMember, WeddingDatabase } from '../types/domain';

/** 创建不携带演示供应商、合同、流水和实际金额的新婚礼项目。 */
export function createEmptyWeddingDatabase(
  template: WeddingDatabase,
  projectId: string,
  projectName: string,
  owner: ProjectMember
): WeddingDatabase {
  const workbook = createDefaultBudgetWorkbook();
  return {
    ...structuredClone(template),
    projectId,
    schemaVersion: 4,
    revision: 1,
    updatedAt: new Date().toISOString(),
    settings: {
      ...template.settings,
      projectName: projectName.trim() || '新婚礼项目',
      status: '筹备中',
      archived: false,
      activeSeatingPlanId: ''
    },
    profile: {
      ...template.profile,
      groomName: '新郎',
      brideName: '新娘',
      weddingDate: '',
      ceremonyTime: '',
      banquetTime: '',
      venueName: '',
      venueAddress: '',
      coordinatorName: owner.name,
      phone: ''
    },
    members: [structuredClone(owner)],
    budget: structuredClone(workbook.budget),
    tasks: structuredClone(workbook.checklistTasks),
    guests: [],
    tables: [],
    seatAssignments: [],
    seatingPlans: [],
    vendors: [],
    timeline: [],
    invitations: [],
    risks: [],
    materials: [],
    attachments: [],
    quotes: [],
    contracts: [],
    transactions: [],
    runbookEvents: [],
    checkIns: [],
    incidents: [],
    conflicts: [],
    outbox: [],
    auditLogs: []
  };
}
