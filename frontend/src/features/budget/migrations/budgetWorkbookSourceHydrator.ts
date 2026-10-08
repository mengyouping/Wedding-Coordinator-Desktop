import type { BudgetItem, WeddingDatabase, WeddingTask } from '../../../types/domain';
import type { BudgetCategory, BudgetParameter, BudgetPaymentMilestone } from '../../../types/budgetWorkbook';

type UnknownRecord = Record<string, unknown>;
const record = (value: unknown): UnknownRecord => value && typeof value === 'object' ? value as UnknownRecord : {};
const array = (value: unknown): unknown[] => Array.isArray(value) ? value : [];
const text = (value: unknown, fallback = ''): string => typeof value === 'string' ? value : fallback;
const number = (value: unknown, fallback = 0): number => typeof value === 'number' && Number.isFinite(value) ? value : fallback;
const bool = (value: unknown, fallback = false): boolean => typeof value === 'boolean' ? value : fallback;
const strings = (value: unknown): string[] => array(value).map(item => text(item)).filter(Boolean);

function category(value: unknown): BudgetCategory {
  const row = record(value);
  const result: BudgetCategory = {
    id: text(row.id), parentId: text(row.parentId), level: number(row.level, 1) === 2 ? 2 : 1,
    name: text(row.name), code: text(row.code), sortOrder: Math.max(0, number(row.sortOrder)),
    guidance: text(row.guidance), enabled: bool(row.enabled, true)
  };
  if (typeof row.recommendedMinRate === 'number') result.recommendedMinRate = row.recommendedMinRate;
  if (typeof row.recommendedMaxRate === 'number') result.recommendedMaxRate = row.recommendedMaxRate;
  return result;
}

function parameter(value: unknown): BudgetParameter {
  const row = record(value);
  const rawValue = typeof row.value === 'boolean' || typeof row.value === 'number' || typeof row.value === 'string' ? row.value : 0;
  const result: BudgetParameter = {
    id: text(row.id), key: text(row.key), group: text(row.group), name: text(row.name), value: rawValue,
    mode: text(row.mode, 'manual') as BudgetParameter['mode'],
    valueType: text(row.valueType, typeof rawValue === 'boolean' ? 'boolean' : typeof rawValue === 'string' ? 'string' : 'number') as BudgetParameter['valueType'],
    unit: text(row.unit), description: text(row.description), sortOrder: Math.max(0, number(row.sortOrder))
  };
  const sourceKey = text(row.sourceKey);
  const formulaKey = text(row.formulaKey) as BudgetParameter['formulaKey'];
  if (sourceKey) result.sourceKey = sourceKey;
  if (formulaKey) result.formulaKey = formulaKey;
  return result;
}

function milestone(value: unknown): BudgetPaymentMilestone {
  const row = record(value);
  return {
    id: text(row.id), categoryId: text(row.categoryId), budgetItemId: text(row.budgetItemId), vendorName: text(row.vendorName),
    contractId: text(row.contractId), title: text(row.title), recommendedTiming: text(row.recommendedTiming), plannedDate: text(row.plannedDate),
    ratio: Math.max(0, Math.min(1, number(row.ratio))), plannedAmount: Math.max(0, number(row.plannedAmount)),
    triggerCondition: text(row.triggerCondition), acceptanceCriteria: text(row.acceptanceCriteria), ownerName: text(row.ownerName),
    collaboratorNames: strings(row.collaboratorNames), status: text(row.status, '待支付') as BudgetPaymentMilestone['status'],
    sortOrder: Math.max(0, number(row.sortOrder))
  };
}

function itemExtensions(value: unknown): Partial<BudgetItem> {
  const row = record(value);
  return {
    categoryId: text(row.categoryId), secondaryCategoryId: text(row.secondaryCategoryId), sortOrder: number(row.sortOrder),
    included: bool(row.included, true), inclusionParameterKey: text(row.inclusionParameterKey),
    quantitySource: text(row.quantitySource, 'manual') as NonNullable<BudgetItem['quantitySource']>, quantityParameterKey: text(row.quantityParameterKey),
    unitPriceSource: text(row.unitPriceSource, 'manual') as NonNullable<BudgetItem['unitPriceSource']>, unitPriceParameterKey: text(row.unitPriceParameterKey),
    calculationRule: text(row.calculationRule, 'multiply') as NonNullable<BudgetItem['calculationRule']>, paymentTerms: text(row.paymentTerms),
    latestConfirm: text(row.latestConfirm), ownerMemberId: text(row.ownerMemberId), collaboratorMemberIds: strings(row.collaboratorMemberIds),
    acceptanceCriteria: text(row.acceptanceCriteria), riskTip: text(row.riskTip)
  };
}

function taskExtensions(value: unknown): Partial<WeddingTask> {
  const row = record(value);
  return {
    collaborators: strings(row.collaborators), budgetCategoryId: text(row.budgetCategoryId), budgetItemId: text(row.budgetItemId),
    acceptanceCriteria: text(row.acceptanceCriteria), stageCode: text(row.stageCode), sortOrder: number(row.sortOrder),
    source: text(row.source, 'general') as NonNullable<WeddingTask['source']>, parentTaskId: text(row.parentTaskId), contractId: text(row.contractId)
  };
}

/** 将通用 v2-v4 迁移器未识别的预算工作簿字段从原始快照合并回来。 */
export function hydrateBudgetWorkbookSource(sourceValue: unknown, database: WeddingDatabase): WeddingDatabase {
  const source = record(sourceValue);
  const budgetSource = record(source.budget);
  const rawItems = new Map(array(budgetSource.items).map(value => [text(record(value).id), value]));
  const rawTasks = new Map(array(source.tasks).map(value => [text(record(value).id), value]));
  const categories = array(budgetSource.categories).map(category).filter(item => item.id);
  const parameters = array(budgetSource.parameters).map(parameter).filter(item => item.id && item.key);
  const paymentMilestones = array(budgetSource.paymentMilestones).map(milestone).filter(item => item.id);
  const budget = {
    ...database.budget,
    ...(number(budgetSource.workbookVersion) === 5 ? { workbookVersion: 5 as const } : {}),
    ...(categories.length ? { categories } : {}),
    ...(parameters.length ? { parameters } : {}),
    ...(paymentMilestones.length ? { paymentMilestones } : {}),
    items: database.budget.items.map(item => ({ ...item, ...itemExtensions(rawItems.get(item.id)) }))
  };
  return { ...database, budget, tasks: database.tasks.map(task => ({ ...task, ...taskExtensions(rawTasks.get(task.id)) })) };
}
