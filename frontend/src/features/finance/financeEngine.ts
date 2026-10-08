import type { WeddingDatabase } from '../../types/domain';
import { calculateBudgetItems, summarizeBudget } from '../budget/budgetEngine';

export interface FinanceSummary {
  plannedBudget: number;
  budgetCap: number;
  selectedQuotes: number;
  contractValue: number;
  paid: number;
  refunded: number;
  netPaid: number;
  invoiced: number;
  outstanding: number;
  projectedFinal: number;
  varianceToCap: number;
}

const round = (value: number): number => Math.round(value * 100) / 100;

export function summarizeFinance(database: WeddingDatabase): FinanceSummary {
  const budget = summarizeBudget(calculateBudgetItems(database.budget.items, database.budget.params), database.budget.params.totalBudgetCap);
  const selectedQuotes = database.quotes.filter(item => item.selected).reduce((sum, item) => sum + item.amount, 0);
  const contractValue = database.contracts.filter(item => item.status !== '已终止').reduce((sum, item) => sum + item.amount, 0);
  const paid = database.transactions.filter(item => item.type === '付款').reduce((sum, item) => sum + item.amount, 0);
  const refunded = database.transactions.filter(item => item.type === '退款').reduce((sum, item) => sum + item.amount, 0);
  const adjusted = database.transactions.filter(item => item.type === '调整').reduce((sum, item) => sum + item.amount, 0);
  const netPaid = paid - refunded + adjusted;
  const invoiced = database.transactions.filter(item => item.invoiceStatus === '已开票' && item.type === '付款').reduce((sum, item) => sum + item.amount, 0);
  const projectedFinal = Math.max(budget.totalBudget, selectedQuotes, contractValue) + adjusted;
  return {
    plannedBudget: round(budget.totalBudget),
    budgetCap: round(database.budget.params.totalBudgetCap),
    selectedQuotes: round(selectedQuotes),
    contractValue: round(contractValue),
    paid: round(paid),
    refunded: round(refunded),
    netPaid: round(netPaid),
    invoiced: round(invoiced),
    outstanding: round(Math.max(0, contractValue - netPaid)),
    projectedFinal: round(projectedFinal),
    varianceToCap: round(projectedFinal - database.budget.params.totalBudgetCap)
  };
}

export function financeWarnings(database: WeddingDatabase): string[] {
  const summary = summarizeFinance(database);
  const warnings: string[] = [];
  if (summary.varianceToCap > 0) warnings.push(`预计最终成本超预算 ¥${summary.varianceToCap.toLocaleString('zh-CN')}`);
  for (const contract of database.contracts) {
    const paid = database.transactions.filter(item => item.contractId === contract.id && item.type === '付款').reduce((sum, item) => sum + item.amount, 0);
    const refunded = database.transactions.filter(item => item.contractId === contract.id && item.type === '退款').reduce((sum, item) => sum + item.amount, 0);
    if (paid - refunded > contract.amount) warnings.push(`合同“${contract.title}”净付款超过合同金额`);
  }
  const selectedByBudget = new Map<string, number>();
  for (const quote of database.quotes.filter(item => item.selected)) selectedByBudget.set(quote.budgetItemId, (selectedByBudget.get(quote.budgetItemId) ?? 0) + 1);
  for (const [budgetItemId, count] of selectedByBudget) if (count > 1) warnings.push(`预算项 ${budgetItemId} 选中了 ${count} 份报价`);
  return warnings;
}
