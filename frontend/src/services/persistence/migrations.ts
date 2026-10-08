import type {
  Attachment,
  AuditLog,
  CheckInRecord,
  ConflictRecord,
  ContractRecord,
  FinancialTransaction,
  Guest,
  IncidentRecord,
  Invitation,
  MaterialItem,
  OutboxCommand,
  ProjectMember,
  ProjectSettings,
  Quote,
  RiskItem,
  RunbookEvent,
  SeatAssignment,
  SeatingPlan,
  TimelineItem,
  Vendor,
  WeddingDatabase,
  WeddingTable,
  WeddingTask
} from '../../types/domain';

type UnknownRecord = Record<string, unknown>;

const asRecord = (value: unknown): UnknownRecord => value && typeof value === 'object' ? value as UnknownRecord : {};
const asArray = (value: unknown): unknown[] => Array.isArray(value) ? value : [];
const asString = (value: unknown, fallback = ''): string => typeof value === 'string' ? value : fallback;
const asNumber = (value: unknown, fallback = 0): number => typeof value === 'number' && Number.isFinite(value) ? value : fallback;
const asBoolean = (value: unknown, fallback = false): boolean => typeof value === 'boolean' ? value : fallback;
const asStringArray = (value: unknown): string[] => asArray(value).map(item => asString(item)).filter(Boolean);

export function createInvitationToken(invitationId: string, guestId: string): string {
  const source = `${invitationId}:${guestId}:wedding-os`;
  let hash = 2166136261;
  for (const char of source) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return `${invitationId}-${Math.abs(hash >>> 0).toString(36)}`;
}

function normalizeTask(value: unknown): WeddingTask {
  const row = asRecord(value);
  return {
    id: asString(row.id),
    title: asString(row.title),
    description: asString(row.description),
    owner: asString(row.owner, '总指挥'),
    phase: asString(row.phase, '待启动') as WeddingTask['phase'],
    priority: asString(row.priority, 'P1') as WeddingTask['priority'],
    dueDate: asString(row.dueDate),
    category: asString(row.category, '综合'),
    progress: asNumber(row.progress),
    dependencyIds: asStringArray(row.dependencyIds),
    checklist: asArray(row.checklist).map(item => {
      const checklist = asRecord(item);
      return { id: asString(checklist.id), title: asString(checklist.title), done: asBoolean(checklist.done) };
    }),
    reminderAt: asString(row.reminderAt),
    relatedRiskIds: asStringArray(row.relatedRiskIds)
  };
}

function normalizeGuest(value: unknown): Guest {
  const row = asRecord(value);
  return {
    id: asString(row.id),
    name: asString(row.name),
    side: asString(row.side, '共同') as Guest['side'],
    group: asString(row.group, '朋友'),
    householdName: asString(row.householdName, asString(row.name)),
    rsvp: asString(row.rsvp, '待回复') as Guest['rsvp'],
    companions: Math.max(0, asNumber(row.companions)),
    children: Math.max(0, asNumber(row.children)),
    phone: asString(row.phone),
    dietary: asString(row.dietary),
    transportNeed: asString(row.transportNeed),
    accommodationNeed: asString(row.accommodationNeed),
    accessibilityNeed: asString(row.accessibilityNeed),
    preferredTableIds: asStringArray(row.preferredTableIds),
    mustSitWithGuestIds: asStringArray(row.mustSitWithGuestIds),
    avoidGuestIds: asStringArray(row.avoidGuestIds),
    note: asString(row.note)
  };
}

function normalizeTable(value: unknown): WeddingTable {
  const row = asRecord(value);
  return {
    id: asString(row.id),
    name: asString(row.name),
    zone: asString(row.zone, '主厅'),
    capacity: Math.max(1, asNumber(row.capacity, 10)),
    shape: asString(row.shape, '圆桌') as WeddingTable['shape'],
    status: asString(row.status, '空闲') as WeddingTable['status'],
    note: asString(row.note),
    tableNo: asString(row.tableNo),
    x: asNumber(row.x),
    y: asNumber(row.y),
    rotation: asNumber(row.rotation),
    accessible: asBoolean(row.accessible)
  };
}

function normalizeVendor(value: unknown): Vendor {
  const row = asRecord(value);
  return {
    id: asString(row.id),
    name: asString(row.name),
    category: asString(row.category, '其他'),
    contactName: asString(row.contactName),
    phone: asString(row.phone),
    contractAmount: Math.max(0, asNumber(row.contractAmount)),
    paidAmount: Math.max(0, asNumber(row.paidAmount)),
    nextPaymentDate: asString(row.nextPaymentDate),
    status: asString(row.status, '待询价') as Vendor['status'],
    rating: Math.min(5, Math.max(0, asNumber(row.rating, 5))),
    riskLevel: asString(row.riskLevel, '低') as Vendor['riskLevel'],
    note: asString(row.note),
    payments: asArray(row.payments).map(item => {
      const payment = asRecord(item);
      return {
        id: asString(payment.id),
        title: asString(payment.title),
        amount: Math.max(0, asNumber(payment.amount)),
        dueDate: asString(payment.dueDate),
        status: asString(payment.status, '待支付') as NonNullable<Vendor['payments']>[number]['status'],
        invoiceStatus: asString(payment.invoiceStatus, '未开票') as NonNullable<Vendor['payments']>[number]['invoiceStatus']
      };
    }),
    deliverables: asStringArray(row.deliverables),
    quoteIds: asStringArray(row.quoteIds),
    contractIds: asStringArray(row.contractIds)
  };
}

function normalizeTimeline(value: unknown): TimelineItem {
  const row = asRecord(value);
  return {
    id: asString(row.id),
    time: asString(row.time, '12:00'),
    title: asString(row.title),
    owner: asString(row.owner, '总指挥'),
    location: asString(row.location, '主会场'),
    durationMinutes: Math.max(1, asNumber(row.durationMinutes, 30)),
    status: asString(row.status, '待确认') as TimelineItem['status'],
    dependency: asString(row.dependency),
    note: asString(row.note),
    track: asString(row.track, '主流程'),
    dependencyIds: asStringArray(row.dependencyIds),
    cue: asString(row.cue),
    music: asString(row.music),
    lockedTime: asBoolean(row.lockedTime),
    actualStartAt: asString(row.actualStartAt),
    actualEndAt: asString(row.actualEndAt)
  };
}

function normalizeInvitation(value: unknown): Invitation {
  const row = asRecord(value);
  const id = asString(row.id);
  const guestId = asString(row.guestId);
  return {
    id,
    guestId,
    template: asString(row.template, 'champagne') as Invitation['template'],
    salutation: asString(row.salutation),
    message: asString(row.message),
    status: asString(row.status, '草稿') as Invitation['status'],
    sentAt: asString(row.sentAt),
    openedAt: asString(row.openedAt),
    respondedAt: asString(row.respondedAt),
    token: asString(row.token, createInvitationToken(id, guestId))
  };
}

function normalizeRisk(value: unknown): RiskItem {
  const row = asRecord(value);
  return {
    id: asString(row.id),
    title: asString(row.title),
    category: asString(row.category, '综合'),
    probability: Math.min(5, Math.max(1, asNumber(row.probability, 1))),
    impact: Math.min(5, Math.max(1, asNumber(row.impact, 1))),
    owner: asString(row.owner, '总指挥'),
    trigger: asString(row.trigger),
    responsePlan: asString(row.responsePlan),
    status: asString(row.status, '开放') as RiskItem['status'],
    dueDate: asString(row.dueDate),
    mitigationTaskIds: asStringArray(row.mitigationTaskIds),
    residualProbability: Math.min(5, Math.max(1, asNumber(row.residualProbability, asNumber(row.probability, 1)))),
    residualImpact: Math.min(5, Math.max(1, asNumber(row.residualImpact, asNumber(row.impact, 1))))
  };
}

function normalizeMaterial(value: unknown): MaterialItem {
  const row = asRecord(value);
  return {
    id: asString(row.id),
    name: asString(row.name),
    category: asString(row.category, '其他'),
    quantity: Math.max(0, asNumber(row.quantity, 1)),
    unit: asString(row.unit, '件'),
    owner: asString(row.owner, '总指挥'),
    status: asString(row.status, '待采购') as MaterialItem['status'],
    supplier: asString(row.supplier),
    expectedDate: asString(row.expectedDate),
    checkedQuantity: Math.max(0, asNumber(row.checkedQuantity)),
    boxCode: asString(row.boxCode),
    note: asString(row.note),
    storageLocation: asString(row.storageLocation),
    handoverTo: asString(row.handoverTo),
    transportStatus: asString(row.transportStatus, '未装箱') as MaterialItem['transportStatus'],
    returnRequired: asBoolean(row.returnRequired),
    returnedQuantity: Math.max(0, asNumber(row.returnedQuantity))
  };
}

function buildSeatAssignments(source: UnknownRecord): SeatAssignment[] {
  const explicit = asArray(source.seatAssignments).map(item => {
    const row = asRecord(item);
    return {
      id: asString(row.id),
      guestId: asString(row.guestId),
      tableId: asString(row.tableId),
      seatNo: asString(row.seatNo),
      companionCount: Math.max(0, asNumber(row.companionCount))
    };
  }).filter(item => item.id && item.guestId && item.tableId);
  if (explicit.length) return explicit;

  const seen = new Set<string>();
  const assignments: SeatAssignment[] = [];
  for (const guestValue of asArray(source.guests)) {
    const guest = asRecord(guestValue);
    const guestId = asString(guest.id);
    const tableId = asString(guest.tableId);
    if (!guestId || !tableId || seen.has(guestId)) continue;
    seen.add(guestId);
    assignments.push({ id: `seat-${guestId}`, guestId, tableId, seatNo: '', companionCount: Math.max(0, asNumber(guest.companions)) });
  }
  for (const tableValue of asArray(source.tables)) {
    const table = asRecord(tableValue);
    const tableId = asString(table.id);
    for (const guestValue of asArray(table.guestIds)) {
      const guestId = asString(guestValue);
      if (!guestId || !tableId || seen.has(guestId)) continue;
      seen.add(guestId);
      assignments.push({ id: `seat-${guestId}`, guestId, tableId, seatNo: '', companionCount: 0 });
    }
  }
  return assignments;
}

function normalizeSettings(source: UnknownRecord): ProjectSettings {
  const settings = asRecord(source.settings);
  const profile = asRecord(source.profile);
  const projectName = `${asString(profile.groomName, '新人')} & ${asString(profile.brideName, '新人')}婚礼`;
  return {
    projectName: asString(settings.projectName, projectName),
    status: asString(settings.status, '筹备中') as ProjectSettings['status'],
    timezone: asString(settings.timezone, 'Asia/Shanghai'),
    currency: 'CNY',
    locale: 'zh-CN',
    archived: asBoolean(settings.archived),
    autoLockMinutes: Math.max(0, asNumber(settings.autoLockMinutes, 15)),
    maskSensitiveByDefault: asBoolean(settings.maskSensitiveByDefault, true),
    activeSeatingPlanId: asString(settings.activeSeatingPlanId)
  };
}

function normalizeMembers(source: UnknownRecord): ProjectMember[] {
  const rows = asArray(source.members);
  if (rows.length) {
    return rows.map(value => {
      const row = asRecord(value);
      return {
        id: asString(row.id),
        name: asString(row.name),
        email: asString(row.email),
        role: asString(row.role, '协作者') as ProjectMember['role'],
        active: asBoolean(row.active, true)
      };
    });
  }
  const profile = asRecord(source.profile);
  return [{ id: 'member-owner', name: asString(profile.coordinatorName, '婚礼总指挥'), email: '', role: '所有者', active: true }];
}

function normalizeSeatingPlan(value: unknown): SeatingPlan {
  const row = asRecord(value);
  return {
    id: asString(row.id),
    name: asString(row.name, '排桌方案'),
    active: asBoolean(row.active),
    score: asNumber(row.score),
    hardViolations: asStringArray(row.hardViolations),
    explanations: asStringArray(row.explanations),
    assignments: asArray(row.assignments).map(item => {
      const assignment = asRecord(item);
      return {
        id: asString(assignment.id),
        guestId: asString(assignment.guestId),
        tableId: asString(assignment.tableId),
        seatNo: asString(assignment.seatNo),
        companionCount: Math.max(0, asNumber(assignment.companionCount))
      };
    }),
    createdAt: asString(row.createdAt, new Date().toISOString())
  };
}

function normalizeAttachment(value: unknown): Attachment {
  const row = asRecord(value);
  return {
    id: asString(row.id), entityType: asString(row.entityType), entityId: asString(row.entityId),
    fileName: asString(row.fileName), mimeType: asString(row.mimeType), size: Math.max(0, asNumber(row.size)),
    storageKey: asString(row.storageKey), hash: asString(row.hash), uploadedBy: asString(row.uploadedBy),
    uploadedAt: asString(row.uploadedAt), visibility: asString(row.visibility, '项目成员') as Attachment['visibility']
  };
}

function normalizeQuote(value: unknown): Quote {
  const row = asRecord(value);
  return {
    id: asString(row.id), vendorId: asString(row.vendorId), budgetItemId: asString(row.budgetItemId),
    title: asString(row.title), amount: Math.max(0, asNumber(row.amount)), validUntil: asString(row.validUntil),
    selected: asBoolean(row.selected), note: asString(row.note)
  };
}

function normalizeContract(value: unknown): ContractRecord {
  const row = asRecord(value);
  return {
    id: asString(row.id), vendorId: asString(row.vendorId), budgetItemIds: asStringArray(row.budgetItemIds),
    title: asString(row.title), amount: Math.max(0, asNumber(row.amount)), signedAt: asString(row.signedAt),
    status: asString(row.status, '草稿') as ContractRecord['status'], attachmentIds: asStringArray(row.attachmentIds), note: asString(row.note)
  };
}

function normalizeTransaction(value: unknown): FinancialTransaction {
  const row = asRecord(value);
  return {
    id: asString(row.id), contractId: asString(row.contractId), vendorId: asString(row.vendorId), budgetItemId: asString(row.budgetItemId),
    type: asString(row.type, '付款') as FinancialTransaction['type'], amount: Math.max(0, asNumber(row.amount)),
    occurredAt: asString(row.occurredAt), invoiceStatus: asString(row.invoiceStatus, '未开票') as FinancialTransaction['invoiceStatus'], note: asString(row.note)
  };
}

function normalizeRunbookEvent(value: unknown): RunbookEvent {
  const row = asRecord(value);
  return {
    id: asString(row.id), timelineItemId: asString(row.timelineItemId), action: asString(row.action, '开始') as RunbookEvent['action'],
    minutes: asNumber(row.minutes), operatorName: asString(row.operatorName, '总指挥'), createdAt: asString(row.createdAt), note: asString(row.note)
  };
}

function normalizeCheckIn(value: unknown): CheckInRecord {
  const row = asRecord(value);
  return {
    id: asString(row.id), targetType: asString(row.targetType, '负责人') as CheckInRecord['targetType'], targetId: asString(row.targetId),
    targetName: asString(row.targetName), status: asString(row.status, '未到场') as CheckInRecord['status'], checkedAt: asString(row.checkedAt),
    operatorName: asString(row.operatorName, '总指挥')
  };
}

function normalizeIncident(value: unknown): IncidentRecord {
  const row = asRecord(value);
  return {
    id: asString(row.id), title: asString(row.title), level: asString(row.level, '中') as IncidentRecord['level'],
    status: asString(row.status, '处理中') as IncidentRecord['status'], owner: asString(row.owner, '总指挥'),
    description: asString(row.description), relatedRiskId: asString(row.relatedRiskId), createdAt: asString(row.createdAt), resolvedAt: asString(row.resolvedAt)
  };
}

function normalizeAudit(value: unknown): AuditLog {
  const row = asRecord(value);
  return {
    id: asString(row.id), action: asString(row.action), entityType: asString(row.entityType), entityId: asString(row.entityId),
    operatorId: asString(row.operatorId), operatorName: asString(row.operatorName), operatorRole: asString(row.operatorRole) as AuditLog['operatorRole'],
    deviceId: asString(row.deviceId), requestId: asString(row.requestId), createdAt: asString(row.createdAt), detail: asString(row.detail)
  };
}

export function migrateDatabase(value: unknown): WeddingDatabase {
  const source = asRecord(value);
  const profile = asRecord(source.profile);
  const budget = asRecord(source.budget);
  const params = asRecord(budget.params);
  const assignments = buildSeatAssignments(source);
  const seatingPlans = asArray(source.seatingPlans).map(normalizeSeatingPlan);
  if (!seatingPlans.length && assignments.length) {
    seatingPlans.push({
      id: 'plan-migrated', name: '迁移后的当前方案', active: true, score: 0,
      hardViolations: [], explanations: ['由旧版当前排桌关系自动迁移'], assignments: structuredClone(assignments),
      createdAt: asString(source.updatedAt, new Date().toISOString())
    });
  }

  const database: WeddingDatabase = {
    schemaVersion: 4,
    projectId: asString(source.projectId, 'wedding-project'),
    revision: Math.max(1, asNumber(source.revision, 1)),
    updatedAt: asString(source.updatedAt, new Date().toISOString()),
    settings: normalizeSettings(source),
    profile: {
      groomName: asString(profile.groomName), brideName: asString(profile.brideName), weddingDate: asString(profile.weddingDate),
      ceremonyTime: asString(profile.ceremonyTime), banquetTime: asString(profile.banquetTime), venueName: asString(profile.venueName),
      venueAddress: asString(profile.venueAddress), coordinatorName: asString(profile.coordinatorName, '婚礼总指挥'), phone: asString(profile.phone)
    },
    members: normalizeMembers(source),
    budget: {
      params: {
        guestCount: Math.max(0, asNumber(params.guestCount)), tableCount: Math.max(0, asNumber(params.tableCount)),
        seatsPerTable: Math.max(1, asNumber(params.seatsPerTable, 10)), bufferRate: Math.min(1, Math.max(0, asNumber(params.bufferRate))),
        weddingDays: Math.max(1, asNumber(params.weddingDays, 1)), totalBudgetCap: Math.max(0, asNumber(params.totalBudgetCap))
      },
      items: asArray(budget.items).map(item => {
        const row = asRecord(item);
        return {
          id: asString(row.id), category: asString(row.category), name: asString(row.name), unit: asString(row.unit),
          unitPrice: Math.max(0, asNumber(row.unitPrice)), quantity: Math.max(0, asNumber(row.quantity)),
          quantityMode: asString(row.quantityMode, 'fixed') as WeddingDatabase['budget']['items'][number]['quantityMode'],
          includeBuffer: asBoolean(row.includeBuffer), actualAmount: Math.max(0, asNumber(row.actualAmount)),
          status: asString(row.status, 'planned') as WeddingDatabase['budget']['items'][number]['status'], note: asString(row.note),
          vendorId: asString(row.vendorId), quoteId: asString(row.quoteId), contractId: asString(row.contractId)
        };
      })
    },
    tasks: asArray(source.tasks).map(normalizeTask),
    guests: asArray(source.guests).map(normalizeGuest),
    tables: asArray(source.tables).map(normalizeTable),
    seatAssignments: assignments,
    seatingPlans,
    vendors: asArray(source.vendors).map(normalizeVendor),
    timeline: asArray(source.timeline).map(normalizeTimeline),
    invitations: asArray(source.invitations).map(normalizeInvitation),
    risks: asArray(source.risks).map(normalizeRisk),
    materials: asArray(source.materials).map(normalizeMaterial),
    attachments: asArray(source.attachments).map(normalizeAttachment),
    quotes: asArray(source.quotes).map(normalizeQuote),
    contracts: asArray(source.contracts).map(normalizeContract),
    transactions: asArray(source.transactions).map(normalizeTransaction),
    runbookEvents: asArray(source.runbookEvents).map(normalizeRunbookEvent),
    checkIns: asArray(source.checkIns).map(normalizeCheckIn),
    incidents: asArray(source.incidents).map(normalizeIncident),
    conflicts: asArray(source.conflicts).map(item => item as ConflictRecord),
    outbox: asArray(source.outbox).map(item => item as OutboxCommand),
    auditLogs: asArray(source.auditLogs).map(normalizeAudit)
  };
  return database;
}
