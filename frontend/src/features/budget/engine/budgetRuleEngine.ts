import type { BudgetItem, FinancialTransaction, WeddingDatabase } from '../../../types/domain';
import type {
  BudgetCategorySummary,
  BudgetParameter,
  ResolvedBudgetItem,
  ResolvedBudgetParameter,
  ResolvedBudgetWorkbook
} from '../../../types/budgetWorkbook';
import { applyFinancialProjection } from '../../finance/financialProjection';

const round = (value: number): number => Math.round((Number.isFinite(value) ? value : 0) * 100) / 100;
const numberValue = (value: number | boolean | string | undefined, fallback = 0): number => {
  const parsed = typeof value === 'number' ? value : typeof value === 'boolean' ? Number(value) : Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};
const boolValue = (value: number | boolean | string | undefined, fallback = false): boolean => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value !== 0;
  if (typeof value === 'string') return value === 'true' || value === '1' || value === '是';
  return fallback;
};

function signedAmount(transaction: FinancialTransaction): number {
  return transaction.type === '退款' ? -transaction.amount : transaction.amount;
}

function guestHeadcount(database: WeddingDatabase, fallback: number): number {
  const accepted = database.guests.filter(item => item.rsvp !== '不出席');
  const rosterCount = accepted.reduce((sum, item) => sum + 1 + Math.max(0, item.companions), 0);
  return Math.max(0, fallback, rosterCount);
}

function parameterFormulaDescription(parameter: BudgetParameter): string {
  switch (parameter.formulaKey) {
    case 'plannedMainTables': return '向上取整（预计宾客人数 + 备用人数）÷ 每桌人数';
    case 'plannedTotalTables': return '计划正桌数 + 备用桌数';
    case 'giftCount105': return '向上取整（预计宾客人数 × 105%）';
    default: return parameter.mode === 'linked' ? '取宾客名单人数与计划保底值中的较大值' : parameter.mode === 'manual' ? '用户手工输入' : '系统公式计算';
  }
}

function resolveParameters(database: WeddingDatabase): { parameters: ResolvedBudgetParameter[]; parameterMap: Map<string, number | boolean | string> } {
  const source = database.budget.parameters ?? [];
  const rawMap = new Map(source.map(item => [item.key, item.value]));
  const resolved = new Map<string, number | boolean | string>();
  const visiting = new Set<string>();

  const resolve = (key: string): number | boolean | string => {
    if (resolved.has(key)) return resolved.get(key)!;
    const parameter = source.find(item => item.key === key);
    if (!parameter) throw new Error(`缺少预算参数：${key}`);
    if (visiting.has(key)) throw new Error(`预算参数形成循环依赖：${key}`);
    visiting.add(key);

    let value: number | boolean | string = parameter.value;
    if (parameter.mode === 'linked' && parameter.sourceKey === 'guests.invitedCount') {
      value = guestHeadcount(database, numberValue(parameter.value));
    } else if (parameter.mode === 'derived') {
      switch (parameter.formulaKey) {
        case 'plannedMainTables': {
          const invited = numberValue(resolve('guest.invitedCount'));
          const backup = numberValue(resolve('guest.backupCount'));
          const seats = Math.max(1, numberValue(resolve('table.seatsPerTable'), 10));
          value = Math.ceil((invited + backup) / seats);
          break;
        }
        case 'plannedTotalTables':
          value = numberValue(resolve('table.mainCount')) + numberValue(resolve('table.backupCount'));
          break;
        case 'giftCount105':
          value = Math.ceil(numberValue(resolve('guest.invitedCount')) * 1.05);
          break;
        default:
          value = rawMap.get(key) ?? parameter.value;
      }
    }

    visiting.delete(key);
    resolved.set(key, value);
    return value;
  };

  const parameters = source
    .slice()
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map(parameter => {
      const resolvedValue = resolve(parameter.key);
      const sourceLabel = parameter.mode === 'manual' ? '手工输入' : parameter.mode === 'linked' ? '来自业务数据' : '公式计算';
      return { ...parameter, resolvedValue, sourceLabel, formulaDescription: parameterFormulaDescription(parameter) };
    });
  return { parameters, parameterMap: resolved };
}

function selectedQuotePrice(database: WeddingDatabase, item: BudgetItem): number | undefined {
  const selected = database.quotes.find(row => row.budgetItemId === item.id && row.selected);
  return selected?.amount;
}

function itemTransactionAmount(database: WeddingDatabase, itemId: string): number {
  return round(database.transactions
    .filter(transaction => transaction.budgetItemId === itemId)
    .reduce((sum, transaction) => sum + signedAmount(transaction), 0));
}

function itemSourceLabels(item: BudgetItem): string[] {
  const labels: string[] = [];
  if (item.inclusionParameterKey) labels.push('来自参数');
  if (item.quantitySource === 'parameter') labels.push('数量来自参数');
  else labels.push('数量手工输入');
  if (item.unitPriceSource === 'parameter') labels.push('单价来自参数');
  else if (item.unitPriceSource === 'quote') labels.push('单价来自报价');
  else labels.push('单价手工输入');
  if (item.calculationRule === 'hotelServiceFee' || item.calculationRule === 'riskReserve') labels.push('公式计算');
  return [...new Set(labels)];
}

function baseItemFormula(item: BudgetItem, quantity: number, unitPrice: number): string {
  if (item.calculationRule === 'hotelServiceFee') return '（婚宴正桌计划额 + 备用桌计划额）× 酒店服务费率';
  if (item.calculationRule === 'riskReserve') return '其他已纳入预算项目合计 × 风险预留比例';
  return `${round(quantity)} ${item.unit || '项'} × ¥${round(unitPrice)}`;
}

function resolveItems(database: WeddingDatabase, parameterMap: Map<string, number | boolean | string>): ResolvedBudgetItem[] {
  const sorted = database.budget.items.slice().sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  const provisional = sorted.map(item => {
    const includedResolved = item.inclusionParameterKey
      ? boolValue(parameterMap.get(item.inclusionParameterKey), item.included !== false)
      : item.included !== false;
    const resolvedQuantity = item.quantitySource === 'parameter' && item.quantityParameterKey
      ? Math.max(0, numberValue(parameterMap.get(item.quantityParameterKey), item.quantity))
      : Math.max(0, item.quantity);
    const quotePrice = item.unitPriceSource === 'quote' ? selectedQuotePrice(database, item) : undefined;
    const resolvedUnitPrice = item.unitPriceSource === 'parameter' && item.unitPriceParameterKey
      ? Math.max(0, numberValue(parameterMap.get(item.unitPriceParameterKey), item.unitPrice))
      : Math.max(0, quotePrice ?? item.unitPrice);
    const budgetAmount = includedResolved ? round(resolvedQuantity * resolvedUnitPrice) : 0;
    const actualAmount = Math.max(0, itemTransactionAmount(database, item.id));
    return {
      ...item,
      includedResolved,
      resolvedQuantity,
      resolvedUnitPrice,
      budgetAmount,
      actualAmount,
      paidAmount: actualAmount,
      outstandingAmount: Math.max(0, round(budgetAmount - actualAmount)),
      varianceAmount: round(actualAmount - budgetAmount),
      sourceLabels: itemSourceLabels(item),
      formulaDescription: baseItemFormula(item, resolvedQuantity, resolvedUnitPrice)
    } satisfies ResolvedBudgetItem;
  });

  const banquetBase = provisional
    .filter(item => item.name === '婚宴正桌' || item.name === '备用桌')
    .reduce((sum, item) => sum + item.budgetAmount, 0);
  const serviceRate = Math.max(0, numberValue(parameterMap.get('hotel.serviceRate')));
  const serviceResolved = provisional.map(item => {
    if (!item.includedResolved || item.calculationRule !== 'hotelServiceFee') return item;
    const budgetAmount = round(banquetBase * serviceRate);
    return {
      ...item,
      budgetAmount,
      outstandingAmount: Math.max(0, round(budgetAmount - item.paidAmount)),
      varianceAmount: round(item.actualAmount - budgetAmount)
    };
  });
  const nonRiskBase = serviceResolved
    .filter(item => item.calculationRule !== 'riskReserve')
    .reduce((sum, item) => sum + item.budgetAmount, 0);
  const reserveRate = Math.max(0, numberValue(parameterMap.get('risk.reserveRate')));

  return serviceResolved.map(item => {
    if (!item.includedResolved) return { ...item, budgetAmount: 0, outstandingAmount: 0, varianceAmount: item.actualAmount };
    if (item.calculationRule !== 'riskReserve') return item;
    const budgetAmount = round(nonRiskBase * reserveRate);
    return {
      ...item,
      budgetAmount,
      outstandingAmount: Math.max(0, round(budgetAmount - item.paidAmount)),
      varianceAmount: round(item.actualAmount - budgetAmount)
    };
  });
}

function categorySummaries(database: WeddingDatabase, items: ResolvedBudgetItem[]): BudgetCategorySummary[] {
  const primaries = (database.budget.categories ?? []).filter(item => item.level === 1 && item.enabled).sort((a, b) => a.sortOrder - b.sortOrder);
  const total = items.reduce((sum, item) => sum + item.budgetAmount, 0);
  return primaries.map(category => {
    const rows = items.filter(item => item.categoryId === category.id || item.category === category.name);
    const planned = round(rows.reduce((sum, item) => sum + item.budgetAmount, 0));
    const actual = round(rows.reduce((sum, item) => sum + item.actualAmount, 0));
    const paid = round(rows.reduce((sum, item) => sum + item.paidAmount, 0));
    const outstanding = round(rows.reduce((sum, item) => sum + item.outstandingAmount, 0));
    const share = total ? round(planned / total) : 0;
    const min = category.recommendedMinRate ?? 0;
    const max = category.recommendedMaxRate ?? 1;
    const risk = share < min ? '低于建议区间' : share > max ? '超建议上限' : '在建议区间';
    return {
      categoryId: category.id,
      categoryName: category.name,
      planned,
      actual,
      paid,
      outstanding,
      share,
      recommendedMinRate: min,
      recommendedMaxRate: max,
      risk,
      guidance: category.guidance ?? ''
    };
  });
}

export function resolveBudgetWorkbook(input: WeddingDatabase): ResolvedBudgetWorkbook {
  const database = applyFinancialProjection(input);
  const { parameters, parameterMap } = resolveParameters(database);
  const items = resolveItems(database, parameterMap);
  const summaries = categorySummaries(database, items);
  const totalPlanned = round(items.reduce((sum, item) => sum + item.budgetAmount, 0));
  const totalActual = round(items.reduce((sum, item) => sum + item.actualAmount, 0));
  const totalPaid = round(items.reduce((sum, item) => sum + item.paidAmount, 0));
  const totalOutstanding = round(items.reduce((sum, item) => sum + item.outstandingAmount, 0));
  const totalBudgetCap = Math.max(0, numberValue(parameterMap.get('budget.totalCap'), database.budget.params.totalBudgetCap));
  const riskReserve = round(items.filter(item => item.calculationRule === 'riskReserve').reduce((sum, item) => sum + item.budgetAmount, 0));
  return {
    database,
    parameters,
    parameterMap,
    items,
    categories: database.budget.categories ?? [],
    categorySummaries: summaries,
    totalBudgetCap,
    totalPlanned,
    totalActual,
    totalPaid,
    totalOutstanding,
    remainingBudget: round(totalBudgetCap - totalActual),
    riskReserve
  };
}
