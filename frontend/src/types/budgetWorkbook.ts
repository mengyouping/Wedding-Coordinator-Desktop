import type { BudgetItem, WeddingDatabase } from './domain';

export type BudgetParameterMode = 'manual' | 'derived' | 'linked';
export type BudgetParameterValueType = 'number' | 'boolean' | 'string';
export type BudgetFormulaKey = 'plannedMainTables' | 'plannedTotalTables' | 'giftCount105';
export type BudgetQuantitySource = 'manual' | 'parameter';
export type BudgetUnitPriceSource = 'manual' | 'parameter' | 'quote';
export type BudgetCalculationRule = 'multiply' | 'hotelServiceFee' | 'riskReserve';

export interface BudgetCategory {
  id: string;
  parentId: string;
  level: 1 | 2;
  name: string;
  code: string;
  sortOrder: number;
  recommendedMinRate?: number;
  recommendedMaxRate?: number;
  guidance?: string;
  enabled: boolean;
}

export interface BudgetParameter {
  id: string;
  key: string;
  group: string;
  name: string;
  value: number | boolean | string;
  mode: BudgetParameterMode;
  valueType: BudgetParameterValueType;
  unit: string;
  sourceKey?: string;
  formulaKey?: BudgetFormulaKey;
  description: string;
  sortOrder: number;
}

export interface BudgetPaymentMilestone {
  id: string;
  categoryId: string;
  budgetItemId?: string;
  vendorName: string;
  contractId?: string;
  title: string;
  recommendedTiming: string;
  plannedDate?: string;
  ratio: number;
  plannedAmount: number;
  triggerCondition: string;
  acceptanceCriteria: string;
  ownerName: string;
  collaboratorNames: string[];
  status: '待支付' | '已支付' | '已逾期' | '已取消';
  sortOrder: number;
}

export interface ResolvedBudgetParameter extends BudgetParameter {
  resolvedValue: number | boolean | string;
  sourceLabel: string;
  formulaDescription: string;
}

export interface ResolvedBudgetItem extends BudgetItem {
  includedResolved: boolean;
  resolvedQuantity: number;
  resolvedUnitPrice: number;
  budgetAmount: number;
  actualAmount: number;
  paidAmount: number;
  outstandingAmount: number;
  varianceAmount: number;
  sourceLabels: string[];
  formulaDescription: string;
}

export interface BudgetCategorySummary {
  categoryId: string;
  categoryName: string;
  planned: number;
  actual: number;
  paid: number;
  outstanding: number;
  share: number;
  recommendedMinRate: number;
  recommendedMaxRate: number;
  risk: '低于建议区间' | '在建议区间' | '超建议上限';
  guidance: string;
}

export interface ResolvedBudgetWorkbook {
  database: WeddingDatabase;
  parameters: ResolvedBudgetParameter[];
  parameterMap: Map<string, number | boolean | string>;
  items: ResolvedBudgetItem[];
  categories: BudgetCategory[];
  categorySummaries: BudgetCategorySummary[];
  totalBudgetCap: number;
  totalPlanned: number;
  totalActual: number;
  totalPaid: number;
  totalOutstanding: number;
  remainingBudget: number;
  riskReserve: number;
}
