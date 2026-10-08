/** ADABAS 与本地 MySQL 统一使用的字符串实体ID，对应 VARCHAR(64)。 */
export type EntityId = string;

/** ADABAS 统一用户ID，对应 VARCHAR(128)。 */
export type ExternalUserId = string;

/** ISO 日期文本，对应 MySQL DATE，格式 YYYY-MM-DD。 */
export type DateText = string;

/** 本地时间文本，对应 MySQL TIME，格式 HH:mm 或 HH:mm:ss。 */
export type TimeText = string;

/** ISO 日期时间文本，对应 MySQL DATETIME(3)。 */
export type DateTimeText = string;

/** 金额数值，对应 MySQL DECIMAL(20,6)，进入领域层后使用有限 number。 */
export type MoneyValue = number;

/** 通用小数值，对应 MySQL DECIMAL(20,6)，进入领域层后使用有限 number。 */
export type DecimalValue = number;

/** 整数计数，对应 MySQL INT，必须是 JavaScript 安全整数。 */
export type IntegerValue = number;

/** 项目修订号，对应 MySQL BIGINT；前端当前限制为 JavaScript 安全整数。 */
export type RevisionValue = number;

/** 数据库布尔值，对应 MySQL TINYINT(1)。 */
export type DatabaseBoolean = 0 | 1;

/**
 * 校验并返回实体ID。数据库列为 VARCHAR(64)，空字符串和超长值必须在发起请求前阻断。
 */
export function toEntityId(value: string, fieldName = '实体ID'): EntityId {
  if (!value.trim()) throw new Error(`${fieldName}不能为空`);
  if (Array.from(value).length > 64) throw new Error(`${fieldName}不能超过64个字符`);
  return value;
}

/**
 * 校验并返回 ADABAS 统一用户ID，对应 VARCHAR(128)。
 */
export function toExternalUserId(value: string, fieldName = '统一用户ID'): ExternalUserId {
  if (!value.trim()) throw new Error(`${fieldName}不能为空`);
  if (Array.from(value).length > 128) throw new Error(`${fieldName}不能超过128个字符`);
  return value;
}

/**
 * 将数据库 0/1 或已有领域布尔值转换为领域布尔值。
 */
export function toDomainBoolean(value: DatabaseBoolean | boolean): boolean {
  return value === true || value === 1;
}

/**
 * 将领域布尔值转换为数据库 TINYINT(1) 值。
 */
export function toDatabaseBoolean(value: boolean): DatabaseBoolean {
  return value ? 1 : 0;
}

/**
 * 将数据库 DECIMAL 字符串或数字转换为可计算的有限数字。
 */
export function toDecimalNumber(value: string | number, fieldName = '小数字段'): DecimalValue {
  const parsed = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(parsed)) throw new Error(`${fieldName}必须是有限数字`);
  return parsed;
}

/**
 * 将数据库整数文本或数字转换为 JavaScript 安全整数。
 */
export function toIntegerNumber(value: string | number, fieldName = '整数字段'): IntegerValue {
  const parsed = typeof value === 'number' ? value : Number(value);
  if (!Number.isSafeInteger(parsed)) throw new Error(`${fieldName}必须是JavaScript安全整数`);
  return parsed;
}
