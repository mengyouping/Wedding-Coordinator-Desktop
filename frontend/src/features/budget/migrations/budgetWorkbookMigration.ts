import type { BudgetItem, WeddingDatabase, WeddingTask } from '../../../types/domain';
import type { BudgetCategory, BudgetParameter } from '../../../types/budgetWorkbook';
import {
  createDefaultBudgetWorkbook,
  defaultBudgetCategories,
  defaultBudgetItems,
  defaultBudgetParameters,
  defaultBudgetPaymentMilestones,
  defaultBudgetChecklistTasks
} from '../data';

const primaryByName = new Map(defaultBudgetCategories.filter(item => item.level === 1).map(item => [item.name, item]));
const secondaryByParent = new Map<string, BudgetCategory[]>();
for (const category of defaultBudgetCategories.filter(item => item.level === 2)) {
  secondaryByParent.set(category.parentId, [...(secondaryByParent.get(category.parentId) ?? []), category]);
}

const categoryAlias: Record<string, string> = {
  宴会餐饮: '酒店餐饮', 场地宴会: '酒店餐饮', 婚礼服务: '婚庆舞美', 策划花艺: '婚庆舞美',
  宾客体验: '宾客接待', 摄影摄像: '影像记录', 其他: '风险预留'
};

function clone<T>(value: T): T { return structuredClone(value); }

function mergeParameterDefaults(existing: BudgetParameter[], database: WeddingDatabase): BudgetParameter[] {
  const current = new Map(existing.map(item => [item.key, item]));
  const legacyValues: Record<string, number> = {
    'budget.totalCap': database.budget.params.totalBudgetCap,
    'guest.invitedCount': database.budget.params.guestCount,
    'table.seatsPerTable': database.budget.params.seatsPerTable,
    'table.totalCount': database.budget.params.tableCount,
    'wedding.days': database.budget.params.weddingDays,
    'risk.reserveRate': database.budget.params.bufferRate
  };
  return defaultBudgetParameters.map(template => {
    const row = current.get(template.key);
    if (row) return { ...clone(template), ...clone(row), id: row.id || template.id, key: template.key };
    const value = legacyValues[template.key];
    return value === undefined ? clone(template) : { ...clone(template), value };
  });
}

function findSecondary(primaryId: string, itemName: string): string {
  const candidates = secondaryByParent.get(primaryId) ?? [];
  const matched = candidates.find(item => itemName.includes(item.name.replace('婚礼', '')));
  return matched?.id ?? candidates[0]?.id ?? '';
}

function enrichLegacyItem(item: BudgetItem, index: number): BudgetItem {
  const primaryName = categoryAlias[item.category] ?? item.category;
  const primary = primaryByName.get(primaryName) ?? primaryByName.get('风险预留')!;
  const secondaryId = item.secondaryCategoryId || findSecondary(primary.id, item.name);
  return {
    ...item,
    category: primary.name,
    categoryId: item.categoryId || primary.id,
    secondaryCategoryId: secondaryId,
    sortOrder: item.sortOrder ?? index + 1,
    included: item.included ?? true,
    quantitySource: item.quantitySource ?? (item.quantityMode === 'table' || item.quantityMode === 'guest' || item.quantityMode === 'day' ? 'parameter' : 'manual'),
    quantityParameterKey: item.quantityParameterKey ?? (item.quantityMode === 'table' ? 'table.totalCount' : item.quantityMode === 'guest' ? 'guest.invitedCount' : item.quantityMode === 'day' ? 'wedding.days' : ''),
    unitPriceSource: item.unitPriceSource ?? 'manual',
    unitPriceParameterKey: item.unitPriceParameterKey ?? '',
    calculationRule: item.calculationRule ?? 'multiply',
    inclusionParameterKey: item.inclusionParameterKey ?? '',
    paymentTerms: item.paymentTerms ?? '',
    latestConfirm: item.latestConfirm ?? '',
    ownerMemberId: item.ownerMemberId ?? '',
    collaboratorMemberIds: item.collaboratorMemberIds ?? [],
    acceptanceCriteria: item.acceptanceCriteria ?? '',
    riskTip: item.riskTip ?? item.note
  };
}

function migrateDemoItems(existing: BudgetItem[]): BudgetItem[] {
  const mappings: Array<[string, string]> = [
    ['b1', '婚宴正桌'], ['b2', '整体策划及项目统筹'], ['b3', '婚礼摄影（全天）'], ['b4', '婚礼伴手礼']
  ];
  const mappedTemplateNames = new Set(mappings.map(([, name]) => name));
  const migrated = mappings.flatMap(([legacyId, templateName]) => {
    const legacy = existing.find(item => item.id === legacyId);
    const template = defaultBudgetItems.find(item => item.name === templateName);
    if (!legacy || !template) return [];
    return [{
      ...clone(template),
      id: legacy.id,
      actualAmount: legacy.actualAmount,
      status: legacy.status,
      note: legacy.note,
      vendorId: legacy.vendorId ?? '',
      quoteId: legacy.quoteId ?? '',
      contractId: legacy.contractId ?? ''
    }];
  });
  return [...migrated, ...defaultBudgetItems.filter(item => !mappedTemplateNames.has(item.name)).map(clone)]
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
}

function normalizeTask(task: WeddingTask, index: number): WeddingTask {
  return {
    ...task,
    collaborators: task.collaborators ?? [],
    budgetCategoryId: task.budgetCategoryId ?? '',
    budgetItemId: task.budgetItemId ?? '',
    acceptanceCriteria: task.acceptanceCriteria ?? '',
    stageCode: task.stageCode ?? '',
    sortOrder: task.sortOrder ?? index + 1,
    source: task.source ?? 'general',
    parentTaskId: task.parentTaskId ?? '',
    contractId: task.contractId ?? ''
  };
}

export function migrateBudgetWorkbook(database: WeddingDatabase): WeddingDatabase {
  const existingCategories = database.budget.categories ?? [];
  const existingParameters = database.budget.parameters ?? [];
  const isDemoUpgrade = database.projectId === 'wedding-2026-demo' && database.budget.workbookVersion !== 5;
  const categories = existingCategories.length ? existingCategories.map(clone) : defaultBudgetCategories.map(clone);
  const parameters = isDemoUpgrade ? defaultBudgetParameters.map(clone) : mergeParameterDefaults(existingParameters, database);
  const items = isDemoUpgrade
    ? migrateDemoItems(database.budget.items)
    : database.budget.items.map(enrichLegacyItem);
  const paymentMilestones = database.budget.paymentMilestones?.length
    ? database.budget.paymentMilestones.map(clone)
    : isDemoUpgrade ? defaultBudgetPaymentMilestones.map(clone) : [];
  const currentTasks = database.tasks.map(normalizeTask);
  const tasks = isDemoUpgrade && !currentTasks.some(task => task.source === 'budget')
    ? [...currentTasks, ...defaultBudgetChecklistTasks.map(clone)]
    : currentTasks;

  const totalCap = Number(parameters.find(item => item.key === 'budget.totalCap')?.value ?? database.budget.params.totalBudgetCap);
  const invited = Number(parameters.find(item => item.key === 'guest.invitedCount')?.value ?? database.budget.params.guestCount);
  const seats = Number(parameters.find(item => item.key === 'table.seatsPerTable')?.value ?? database.budget.params.seatsPerTable);
  const totalTables = Number(parameters.find(item => item.key === 'table.totalCount')?.value ?? database.budget.params.tableCount);
  const riskRate = Number(parameters.find(item => item.key === 'risk.reserveRate')?.value ?? database.budget.params.bufferRate);

  return {
    ...database,
    budget: {
      ...database.budget,
      workbookVersion: 5,
      categories,
      parameters,
      items,
      paymentMilestones,
      params: {
        ...database.budget.params,
        totalBudgetCap: Math.max(0, totalCap),
        guestCount: Math.max(0, invited),
        seatsPerTable: Math.max(1, seats),
        tableCount: Math.max(0, totalTables),
        bufferRate: Math.max(0, riskRate)
      }
    },
    tasks
  };
}

export function createEmptyBudgetWorkbook(): ReturnType<typeof createDefaultBudgetWorkbook> {
  return createDefaultBudgetWorkbook({ includeItems: false, includeChecklist: false });
}
