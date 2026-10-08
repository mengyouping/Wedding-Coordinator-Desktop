export type WeddingTemplateId = 'western-hotel' | 'chinese-banquet' | 'outdoor-lawn' | 'church' | 'destination';
export type OperationsCenterId = 'banquet' | 'venue' | 'staffing' | 'hospitality' | 'ceremony' | 'vendors' | 'logistics' | 'command';
export type OperationsStatus = '待确认' | '进行中' | '已确认' | '已完成' | '有风险';
export type EmergencyLevel = '低' | '中' | '高';

export interface TemplatePackMeta {
  id: WeddingTemplateId;
  name: string;
  shortName: string;
  description: string;
  scenes: string[];
  accent: string;
}

export interface BanquetMenuPlan {
  id: string;
  name: string;
  mealType: string;
  tableType: string;
  tableCount: number;
  pricePerTable: number;
  trialDate: string;
  hotelContact: string;
  dishes: string;
  allergenNotes: string;
  serviceNotes: string;
  status: OperationsStatus;
}

export interface BeveragePlan {
  id: string;
  category: string;
  brand: string;
  product: string;
  spec: string;
  unit: string;
  plannedQty: number;
  stockQty: number;
  openedQty: number;
  returnedQty: number;
  serviceRule: string;
  supplier: string;
  owner: string;
  status: OperationsStatus;
}

export interface VenueDeployment {
  id: string;
  name: string;
  category: string;
  floor: string;
  zone: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  power: string;
  fireAccess: boolean;
  owner: string;
  status: OperationsStatus;
  note: string;
}

export interface StaffPosition {
  id: string;
  team: string;
  position: string;
  scope: string;
  owner: string;
  backup: string;
  contact: string;
  shiftStart: string;
  shiftEnd: string;
  meetingPoint: string;
  reportTo: string;
  checklist: string;
  status: OperationsStatus;
}

export interface HospitalityService {
  id: string;
  serviceType: string;
  guestGroup: string;
  headcount: number;
  arrivalAt: string;
  departureAt: string;
  vehicle: string;
  driver: string;
  hotel: string;
  roomCount: number;
  giftCount: number;
  owner: string;
  status: OperationsStatus;
  note: string;
}

export interface CeremonyProgram {
  id: string;
  time: string;
  type: string;
  title: string;
  durationMinutes: number;
  location: string;
  performer: string;
  hostScript: string;
  music: string;
  media: string;
  cue: string;
  owner: string;
  backup: string;
  rehearsalStatus: string;
  status: OperationsStatus;
}

export interface VendorDelivery {
  id: string;
  vendor: string;
  category: string;
  deliverable: string;
  arrivalAt: string;
  entryGate: string;
  vehicle: string;
  staffCount: number;
  powerNeed: string;
  acceptance: string;
  owner: string;
  exitAt: string;
  status: OperationsStatus;
}

export interface LogisticsRecord {
  id: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  boxCode: string;
  vehicle: string;
  loadOrder: number;
  storage: string;
  handoverTo: string;
  returnRequired: boolean;
  returnedQty: number;
  status: OperationsStatus;
}

export interface EmergencyPlan {
  id: string;
  scenario: string;
  trigger: string;
  level: EmergencyLevel;
  commander: string;
  contacts: string;
  responseSteps: string;
  backupResource: string;
  linkedArea: string;
  status: OperationsStatus;
}

export interface WeddingOperationsDraft {
  version: 1;
  templateId: WeddingTemplateId;
  templateName: string;
  updatedAt: string;
  menus: BanquetMenuPlan[];
  beverages: BeveragePlan[];
  deployments: VenueDeployment[];
  staffPositions: StaffPosition[];
  hospitalityServices: HospitalityService[];
  ceremonyPrograms: CeremonyProgram[];
  vendorDeliveries: VendorDelivery[];
  logisticsRecords: LogisticsRecord[];
  emergencyPlans: EmergencyPlan[];
}

export const operationsStorageKey = (projectId: string): string => `wedding.operations.v1.${projectId}`;
export const pendingOperationsTemplateKey = 'wedding.operations.pending-template';

export function operationId(prefix: string): string {
  return `${prefix}-${crypto.randomUUID()}`;
}

export function completedRate(rows: Array<{ status: OperationsStatus }>): number {
  if (!rows.length) return 0;
  return Math.round(rows.filter(item => item.status === '已完成' || item.status === '已确认').length / rows.length * 100);
}

export function atRiskCount(rows: Array<{ status: OperationsStatus }>): number {
  return rows.filter(item => item.status === '有风险').length;
}
