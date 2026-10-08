import type {
  DatabaseBoolean,
  DateText,
  DateTimeText,
  EntityId,
  ExternalUserId,
  RevisionValue,
  TimeText
} from './persistence';

/** MySQL DECIMAL 在原始 API 层允许以字符串或数字返回，进入领域层前必须调用 toDecimalNumber。 */
export type DatabaseDecimal = string | number;

/** MySQL BIGINT 在原始 API 层允许以字符串或安全整数返回。 */
export type DatabaseBigInteger = string | number;

/** ADABAS / MySQL 通用实体字段。 */
export interface DatabaseEntityRow {
  /** 字符串主键，对应 VARCHAR(64)。 */
  id: EntityId;
  /** 婚礼项目ID，对应 VARCHAR(64)。 */
  project_id: EntityId;
}

/** 带完整审计字段的可变业务实体。 */
export interface DatabaseMutableEntityRow extends DatabaseEntityRow {
  /** 创建人统一用户ID或系统标识，对应 VARCHAR(128)。 */
  created_by: ExternalUserId;
  /** 最后更新人统一用户ID或系统标识，对应 VARCHAR(128)。 */
  updated_by: ExternalUserId;
  /** 创建时间，对应 DATETIME(3)。 */
  created_at: DateTimeText;
  /** 最后更新时间，对应 DATETIME(3)。 */
  updated_at: DateTimeText;
  /** 乐观锁版本号，对应 INT UNSIGNED。 */
  version: number;
  /** 逻辑删除标识，对应 TINYINT(1)。 */
  is_deleted: DatabaseBoolean;
}

/** 婚礼项目数据库行。 */
export interface ProjectDatabaseRow extends Omit<DatabaseMutableEntityRow, 'project_id'> {
  project_name: string;
  template_id: EntityId;
  status: string;
  timezone: string;
  currency: 'CNY';
  locale: 'zh-CN';
  schema_version: number;
  budget_workbook_version: number;
  revision: RevisionValue | string;
  archived: DatabaseBoolean;
  owner_external_user_id: ExternalUserId;
}

/** 婚礼项目设置数据库行。 */
export interface ProjectSettingDatabaseRow extends DatabaseMutableEntityRow {
  auto_lock_minutes: number;
  mask_sensitive_by_default: DatabaseBoolean;
  active_seating_plan_id: EntityId | null;
  default_theme: string;
  public_invitation_base_url: string | null;
  settings_json: Record<string, unknown> | null;
}

/** 婚礼基础资料数据库行。 */
export interface WeddingProfileDatabaseRow extends DatabaseMutableEntityRow {
  groom_name: string;
  bride_name: string;
  wedding_date: DateText | null;
  ceremony_time: TimeText | null;
  banquet_time: TimeText | null;
  venue_name: string;
  venue_address: string;
  coordinator_name: string;
  coordinator_phone: string;
  style_keywords: string | null;
  profile_json: Record<string, unknown> | null;
}

/** 项目成员数据库行。 */
export interface ProjectMemberDatabaseRow extends DatabaseMutableEntityRow {
  external_user_id: ExternalUserId | null;
  member_name: string;
  email: string | null;
  phone: string | null;
  role_code: string;
  active: DatabaseBoolean;
  joined_at: DateTimeText | null;
}

/** 预算工作簿数据库行。 */
export interface BudgetWorkbookDatabaseRow extends DatabaseMutableEntityRow {
  workbook_version: number;
  total_budget_cap: DatabaseDecimal;
  buffer_rate: DatabaseDecimal;
  currency: 'CNY';
  status: string;
}

/** 预算项目数据库行。 */
export interface BudgetItemDatabaseRow extends DatabaseMutableEntityRow {
  workbook_id: EntityId;
  primary_category_id: EntityId;
  secondary_category_id: EntityId;
  item_name: string;
  unit: string;
  included: DatabaseBoolean;
  inclusion_parameter_key: string | null;
  quantity_source: string;
  quantity_parameter_key: string | null;
  quantity: DatabaseDecimal;
  unit_price_source: string;
  unit_price_parameter_key: string | null;
  unit_price: DatabaseDecimal;
  calculation_rule: string;
  planned_amount: DatabaseDecimal;
  actual_amount_cache: DatabaseDecimal;
  status: string;
  vendor_id: EntityId | null;
  selected_quote_id: EntityId | null;
  contract_id: EntityId | null;
  payment_terms: string | null;
  latest_confirm: string | null;
  owner_member_id: EntityId | null;
  acceptance_criteria: string | null;
  risk_tip: string | null;
  note: string | null;
  sort_order: DatabaseDecimal;
}

/** 筹备任务数据库行。 */
export interface TaskDatabaseRow extends DatabaseMutableEntityRow {
  parent_task_id: EntityId | null;
  task_title: string;
  description: string | null;
  owner_name: string | null;
  owner_member_id: EntityId | null;
  phase: string;
  priority: string;
  due_date: DateText | null;
  reminder_at: DateTimeText | null;
  category: string;
  progress: number;
  stage_code: string | null;
  source: string;
  budget_category_id: EntityId | null;
  budget_item_id: EntityId | null;
  contract_id: EntityId | null;
  acceptance_criteria: string | null;
  sort_order: DatabaseDecimal;
}

/** 任务检查项数据库行。 */
export interface TaskChecklistDatabaseRow extends DatabaseEntityRow {
  task_id: EntityId;
  item_title: string;
  done: DatabaseBoolean;
  completed_by: ExternalUserId | null;
  completed_at: DateTimeText | null;
  sort_order: DatabaseDecimal;
  created_at: DateTimeText;
}

/** 宾客与回执数据库行。 */
export interface GuestDatabaseRow extends DatabaseMutableEntityRow {
  household_id: EntityId | null;
  group_id: EntityId | null;
  guest_name: string;
  side: string;
  relation_group: string | null;
  phone: string | null;
  email: string | null;
  rsvp_status: string;
  companions: number;
  children: number;
  dietary: string | null;
  transport_need: string | null;
  accommodation_need: string | null;
  accessibility_need: string | null;
  vip_level: string | null;
  check_in_code: string | null;
  note: string | null;
}

/** 排桌方案数据库行。 */
export interface SeatingPlanDatabaseRow extends DatabaseEntityRow {
  plan_name: string;
  active: DatabaseBoolean;
  score: DatabaseDecimal;
  hard_violations: string[] | null;
  explanations: string[] | null;
  created_by: ExternalUserId;
  created_at: DateTimeText;
}

/** 婚宴桌位数据库行。 */
export interface WeddingTableDatabaseRow extends DatabaseMutableEntityRow {
  seating_plan_id: EntityId | null;
  venue_area_id: EntityId | null;
  table_name: string;
  table_no: string | null;
  zone: string;
  capacity: number;
  shape: string;
  status: string;
  x: DatabaseDecimal;
  y: DatabaseDecimal;
  rotation: DatabaseDecimal;
  accessible: DatabaseBoolean;
  locked: DatabaseBoolean;
  note: string | null;
}

/** 宾客桌位唯一事实源数据库行。 */
export interface SeatAssignmentDatabaseRow extends DatabaseEntityRow {
  seating_plan_id: EntityId | null;
  guest_id: EntityId;
  table_id: EntityId;
  seat_no: string | null;
  companion_count: number;
  locked: DatabaseBoolean;
  assigned_by: ExternalUserId | null;
  assigned_at: DateTimeText;
}

/** 供应商数据库行。 */
export interface VendorDatabaseRow extends DatabaseMutableEntityRow {
  vendor_name: string;
  category: string;
  contact_name: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  business_license_no: string | null;
  status: string;
  rating: DatabaseDecimal;
  risk_level: string;
  note: string | null;
}

/** 供应商付款计划数据库行。 */
export interface VendorPaymentPlanDatabaseRow extends DatabaseEntityRow {
  vendor_id: EntityId;
  title: string;
  amount: DatabaseDecimal;
  due_date: DateText | null;
  payment_status: string;
  invoice_status: string;
  note: string | null;
  created_at: DateTimeText;
  updated_at: DateTimeText;
}

/** 供应商报价数据库行。 */
export interface QuoteDatabaseRow extends DatabaseMutableEntityRow {
  vendor_id: EntityId;
  budget_item_id: EntityId | null;
  quote_title: string;
  total_amount: DatabaseDecimal;
  tax_rate: DatabaseDecimal | null;
  valid_until: DateText | null;
  selected: DatabaseBoolean;
  quote_status: string;
  attachment_id: EntityId | null;
  note: string | null;
}

/** 合同数据库行。 */
export interface ContractDatabaseRow extends DatabaseMutableEntityRow {
  vendor_id: EntityId;
  contract_no: string | null;
  contract_title: string;
  contract_amount: DatabaseDecimal;
  signed_at: DateText | null;
  effective_at: DateText | null;
  expires_at: DateText | null;
  status: string;
  payment_terms: string | null;
  breach_terms: string | null;
  termination_terms: string | null;
  attachment_id: EntityId | null;
  note: string | null;
}

/** 实际资金流水数据库行。 */
export interface FinancialTransactionDatabaseRow extends DatabaseMutableEntityRow {
  contract_id: EntityId | null;
  vendor_id: EntityId | null;
  budget_item_id: EntityId | null;
  transaction_type: string;
  amount: DatabaseDecimal;
  occurred_at: DateText;
  payment_method: string | null;
  bank_reference: string | null;
  invoice_status: string;
  payer_name: string | null;
  payee_name: string | null;
  note: string | null;
}

/** 婚礼日流程节点数据库行。 */
export interface TimelineItemDatabaseRow extends DatabaseMutableEntityRow {
  track_id: EntityId | null;
  item_time: TimeText;
  item_title: string;
  owner_name: string;
  location: string;
  duration_minutes: number;
  status: string;
  dependency_text: string | null;
  cue: string | null;
  music: string | null;
  locked_time: DatabaseBoolean;
  actual_start_at: DateTimeText | null;
  actual_end_at: DateTimeText | null;
  note: string | null;
  sort_order: DatabaseDecimal;
}

/** 电子请帖数据库行。 */
export interface InvitationDatabaseRow extends DatabaseMutableEntityRow {
  guest_id: EntityId;
  theme_id: string;
  salutation: string;
  message: string;
  status: string;
  token_hash: string;
  token_hint: string | null;
  expires_at: DateTimeText | null;
  sent_at: DateTimeText | null;
  opened_at: DateTimeText | null;
  responded_at: DateTimeText | null;
  revoked_at: DateTimeText | null;
}

/** 物料数据库行。 */
export interface MaterialDatabaseRow extends DatabaseMutableEntityRow {
  material_name: string;
  category: string;
  quantity: DatabaseDecimal;
  unit: string;
  owner_name: string | null;
  supplier_name: string | null;
  expected_date: DateText | null;
  checked_quantity: DatabaseDecimal;
  storage_location: string | null;
  handover_to: string | null;
  purchase_status: string;
  transport_status: string;
  return_required: DatabaseBoolean;
  returned_quantity: DatabaseDecimal;
  budget_item_id: EntityId | null;
  vendor_id: EntityId | null;
  note: string | null;
}

/** 风险数据库行。 */
export interface RiskDatabaseRow extends DatabaseMutableEntityRow {
  risk_title: string;
  category: string;
  probability: number;
  impact: number;
  residual_probability: number | null;
  residual_impact: number | null;
  owner_name: string | null;
  trigger_signal: string | null;
  response_plan: string | null;
  status: string;
  due_date: DateText | null;
}

/** 附件数据库行。 */
export interface AttachmentDatabaseRow extends DatabaseEntityRow {
  file_name: string;
  original_file_name: string | null;
  mime_type: string;
  file_size: DatabaseBigInteger;
  storage_provider: string;
  storage_bucket: string | null;
  storage_key: string;
  checksum_sha256: string;
  visibility: string;
  encryption_status: string;
  uploaded_by: ExternalUserId;
  uploaded_at: DateTimeText;
  deleted_at: DateTimeText | null;
  version: number;
  is_deleted: DatabaseBoolean;
}

/** 离线待同步命令数据库行。 */
export interface OutboxCommandDatabaseRow extends DatabaseEntityRow {
  base_revision: RevisionValue | string;
  permission_key: string | null;
  command_type: string;
  command_json: Record<string, unknown>;
  idempotency_key: string;
  attempts: number;
  status: string;
  last_error: string | null;
  next_retry_at: DateTimeText | null;
  created_at: DateTimeText;
  updated_at: DateTimeText;
}

/** 项目版本冲突数据库行。 */
export interface ConflictRecordDatabaseRow extends DatabaseEntityRow {
  outbox_id: EntityId | null;
  local_revision: RevisionValue | string;
  remote_revision: RevisionValue | string | null;
  command_type: string;
  command_json: Record<string, unknown>;
  conflict_fields: string[] | null;
  message: string | null;
  status: string;
  resolved_by: ExternalUserId | null;
  resolved_at: DateTimeText | null;
  created_at: DateTimeText;
}
