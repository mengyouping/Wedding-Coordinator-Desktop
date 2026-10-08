export type ThemeId = 'champagne' | 'moonlight' | 'rose' | 'midnight' | 'festival' | 'kawaii';
export type RouteId =
  | 'projects'
  | 'dashboard'
  | 'operations'
  | 'warroom'
  | 'settings'
  | 'conflicts'
  | 'budget'
  | 'finance'
  | 'tasks'
  | 'guests'
  | 'seating'
  | 'vendors'
  | 'timeline'
  | 'invitations'
  | 'attachments'
  | 'risks'
  | 'materials';
export type Priority = 'P0' | 'P1' | 'P2';
export type TaskPhase = '待启动' | '进行中' | '待确认' | '已完成';
export type RsvpStatus = '已确认' | '待回复' | '不出席';
export type QuantityMode = 'fixed' | 'table' | 'guest' | 'day';
export type BudgetStatus = 'planned' | 'quoted' | 'confirmed' | 'paid';
export type RiskLevel = '低' | '中' | '高';
export type VendorStatus = '待询价' | '待签约' | '执行中' | '已完成';
export type TimelineStatus = '待确认' | '已确认' | '已完成';
export type TableStatus = '空闲' | '编排中' | '已锁定';
export type InvitationStatus = '草稿' | '待发送' | '已发送' | '已确认';
export type MaterialStatus = '待采购' | '采购中' | '已到货' | '待验收' | '已验收';
export type ProjectStatus = '筹备中' | '已完成' | '已归档';
export type MemberRole = '所有者' | '总指挥' | '协作者' | '只读';
export type PaymentStatus = '待支付' | '已支付' | '已逾期' | '已取消';
export type InvoiceStatus = '未开票' | '开票中' | '已开票';
export type TransportStatus = '未装箱' | '已装箱' | '运输中' | '已到场' | '已回收';
export type PermissionKey =
  | 'project.read'
  | 'project.write'
  | 'project.delete'
  | 'member.manage'
  | 'budget.write'
  | 'guest.write'
  | 'seating.write'
  | 'execution.write'
  | 'privacy.export'
  | 'audit.read';

export interface CurrentUser {
  id: string;
  name: string;
  email: string;
  role: MemberRole;
  deviceId: string;
}

export interface ProjectSettings {
  projectName: string;
  status: ProjectStatus;
  timezone: string;
  currency: 'CNY';
  locale: 'zh-CN';
  archived: boolean;
  autoLockMinutes: number;
  maskSensitiveByDefault: boolean;
  activeSeatingPlanId?: string;
}

export interface ProjectMember {
  id: string;
  name: string;
  email: string;
  role: MemberRole;
  active: boolean;
}

export interface ProjectSummary {
  projectId: string;
  projectName: string;
  groomName: string;
  brideName: string;
  weddingDate: string;
  status: ProjectStatus;
  archived: boolean;
  lastOpenedAt: string;
  revision: number;
}

export interface WeddingProfile {
  groomName: string;
  brideName: string;
  weddingDate: string;
  ceremonyTime: string;
  banquetTime: string;
  venueName: string;
  venueAddress: string;
  coordinatorName: string;
  phone: string;
}

export interface BudgetParams {
  guestCount: number;
  tableCount: number;
  seatsPerTable: number;
  bufferRate: number;
  weddingDays: number;
  totalBudgetCap: number;
}

export interface BudgetItem {
  id: string;
  category: string;
  name: string;
  unit: string;
  unitPrice: number;
  quantity: number;
  quantityMode: QuantityMode;
  includeBuffer: boolean;
  actualAmount: number;
  status: BudgetStatus;
  note: string;
  vendorId?: string;
  quoteId?: string;
  contractId?: string;
}

export interface BudgetData {
  params: BudgetParams;
  items: BudgetItem[];
}

export interface TaskChecklistItem {
  id: string;
  title: string;
  done: boolean;
}

export interface WeddingTask {
  id: string;
  title: string;
  description: string;
  owner: string;
  phase: TaskPhase;
  priority: Priority;
  dueDate: string;
  category: string;
  progress: number;
  dependencyIds?: string[];
  checklist?: TaskChecklistItem[];
  reminderAt?: string;
  relatedRiskIds?: string[];
}

export interface Guest {
  id: string;
  name: string;
  side: '男方' | '女方' | '共同';
  group: string;
  householdName?: string;
  rsvp: RsvpStatus;
  companions: number;
  children?: number;
  phone: string;
  dietary: string;
  transportNeed?: string;
  accommodationNeed?: string;
  accessibilityNeed?: string;
  preferredTableIds?: string[];
  mustSitWithGuestIds?: string[];
  avoidGuestIds?: string[];
  note: string;
}

export interface WeddingTable {
  id: string;
  name: string;
  zone: string;
  capacity: number;
  shape: '圆桌' | '方桌';
  status: TableStatus;
  note: string;
  tableNo?: string;
  x?: number;
  y?: number;
  rotation?: number;
  accessible?: boolean;
}

export interface SeatAssignment {
  id: string;
  guestId: string;
  tableId: string;
  seatNo: string;
  companionCount: number;
}

export interface SeatingPlan {
  id: string;
  name: string;
  active: boolean;
  score: number;
  hardViolations: string[];
  explanations: string[];
  assignments: SeatAssignment[];
  createdAt: string;
}

export interface VendorPayment {
  id: string;
  title: string;
  amount: number;
  dueDate: string;
  status: PaymentStatus;
  invoiceStatus: InvoiceStatus;
}

export interface Vendor {
  id: string;
  name: string;
  category: string;
  contactName: string;
  phone: string;
  contractAmount: number;
  paidAmount: number;
  nextPaymentDate: string;
  status: VendorStatus;
  rating: number;
  riskLevel: RiskLevel;
  note: string;
  payments?: VendorPayment[];
  deliverables?: string[];
  quoteIds?: string[];
  contractIds?: string[];
}

export interface TimelineItem {
  id: string;
  time: string;
  title: string;
  owner: string;
  location: string;
  durationMinutes: number;
  status: TimelineStatus;
  dependency: string;
  note: string;
  track?: string;
  dependencyIds?: string[];
  cue?: string;
  music?: string;
  lockedTime?: boolean;
  actualStartAt?: string;
  actualEndAt?: string;
}

export interface Invitation {
  id: string;
  guestId: string;
  template: ThemeId;
  salutation: string;
  message: string;
  status: InvitationStatus;
  sentAt: string;
  openedAt: string;
  respondedAt: string;
  token?: string;
}

export interface RiskItem {
  id: string;
  title: string;
  category: string;
  probability: number;
  impact: number;
  owner: string;
  trigger: string;
  responsePlan: string;
  status: '开放' | '处理中' | '已关闭';
  dueDate: string;
  mitigationTaskIds?: string[];
  residualProbability?: number;
  residualImpact?: number;
}

export interface MaterialItem {
  id: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  owner: string;
  status: MaterialStatus;
  supplier: string;
  expectedDate: string;
  checkedQuantity: number;
  boxCode: string;
  note: string;
  storageLocation?: string;
  handoverTo?: string;
  transportStatus?: TransportStatus;
  returnRequired?: boolean;
  returnedQuantity?: number;
}

export interface Attachment {
  id: string;
  entityType: string;
  entityId: string;
  fileName: string;
  mimeType: string;
  size: number;
  storageKey: string;
  hash: string;
  uploadedBy: string;
  uploadedAt: string;
  visibility: '项目成员' | '仅所有者';
}

export interface Quote {
  id: string;
  vendorId: string;
  budgetItemId: string;
  title: string;
  amount: number;
  validUntil: string;
  selected: boolean;
  note: string;
}

export interface ContractRecord {
  id: string;
  vendorId: string;
  budgetItemIds: string[];
  title: string;
  amount: number;
  signedAt: string;
  status: '草稿' | '已签署' | '履约中' | '已完成' | '已终止';
  attachmentIds: string[];
  note: string;
}

export interface FinancialTransaction {
  id: string;
  contractId?: string;
  vendorId?: string;
  budgetItemId?: string;
  type: '付款' | '退款' | '调整';
  amount: number;
  occurredAt: string;
  invoiceStatus: InvoiceStatus;
  note: string;
}

export interface RunbookEvent {
  id: string;
  timelineItemId: string;
  action: '开始' | '完成' | '跳过' | '延迟' | '恢复';
  minutes?: number;
  operatorName: string;
  createdAt: string;
  note: string;
}

export interface CheckInRecord {
  id: string;
  targetType: '负责人' | '供应商' | '物料';
  targetId: string;
  targetName: string;
  status: '未到场' | '已到场' | '已离场';
  checkedAt: string;
  operatorName: string;
}

export interface IncidentRecord {
  id: string;
  title: string;
  level: RiskLevel;
  status: '处理中' | '已解决';
  owner: string;
  description: string;
  relatedRiskId?: string;
  createdAt: string;
  resolvedAt?: string;
}

export interface AuditLog {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  operatorId?: string;
  operatorName: string;
  operatorRole?: MemberRole;
  deviceId?: string;
  requestId?: string;
  createdAt: string;
  detail: string;
}

export interface OutboxCommand {
  id: string;
  projectId: string;
  baseRevision: number;
  command: WeddingCommand;
  status: '待同步' | '同步中' | '失败';
  attempts: number;
  createdAt: string;
  lastError: string;
}

export interface ConflictRecord {
  id: string;
  projectId: string;
  localRevision: number;
  remoteRevision?: number;
  command: WeddingCommand;
  fields: string[];
  message: string;
  status: '待处理' | '已重试' | '已放弃' | '采用服务端';
  createdAt: string;
}

export interface WeddingDatabase {
  schemaVersion: 4;
  projectId: string;
  revision: number;
  updatedAt: string;
  settings: ProjectSettings;
  profile: WeddingProfile;
  members: ProjectMember[];
  budget: BudgetData;
  tasks: WeddingTask[];
  guests: Guest[];
  tables: WeddingTable[];
  seatAssignments: SeatAssignment[];
  seatingPlans: SeatingPlan[];
  vendors: Vendor[];
  timeline: TimelineItem[];
  invitations: Invitation[];
  risks: RiskItem[];
  materials: MaterialItem[];
  attachments: Attachment[];
  quotes: Quote[];
  contracts: ContractRecord[];
  transactions: FinancialTransaction[];
  runbookEvents: RunbookEvent[];
  checkIns: CheckInRecord[];
  incidents: IncidentRecord[];
  conflicts: ConflictRecord[];
  outbox: OutboxCommand[];
  auditLogs: AuditLog[];
}

export type CollectionKey =
  | 'tasks'
  | 'guests'
  | 'tables'
  | 'seatAssignments'
  | 'seatingPlans'
  | 'vendors'
  | 'timeline'
  | 'invitations'
  | 'risks'
  | 'materials'
  | 'members'
  | 'attachments'
  | 'quotes'
  | 'contracts'
  | 'transactions'
  | 'runbookEvents'
  | 'checkIns'
  | 'incidents';

export interface CollectionEntityMap {
  tasks: WeddingTask;
  guests: Guest;
  tables: WeddingTable;
  seatAssignments: SeatAssignment;
  seatingPlans: SeatingPlan;
  vendors: Vendor;
  timeline: TimelineItem;
  invitations: Invitation;
  risks: RiskItem;
  materials: MaterialItem;
  members: ProjectMember;
  attachments: Attachment;
  quotes: Quote;
  contracts: ContractRecord;
  transactions: FinancialTransaction;
  runbookEvents: RunbookEvent;
  checkIns: CheckInRecord;
  incidents: IncidentRecord;
}

export type WeddingCommand =
  | { type: 'profile.replace'; payload: WeddingProfile }
  | { type: 'settings.replace'; payload: ProjectSettings }
  | { type: 'budget.replace'; payload: BudgetData }
  | { type: 'collection.replace'; key: CollectionKey; payload: CollectionEntityMap[CollectionKey][] }
  | { type: 'snapshot.replace'; payload: WeddingDatabase };
