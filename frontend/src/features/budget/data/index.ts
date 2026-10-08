import type { BudgetData, BudgetItem, WeddingTask } from '../../../types/domain';
import { defaultBudgetCategories } from './budgetCategories';
import { defaultBudgetParameters } from './budgetParameters';
import { defaultBudgetItemsPart1 } from './budgetItemsPart1';
import { defaultBudgetItemsPart2 } from './budgetItemsPart2';
import { defaultBudgetItemsPart3 } from './budgetItemsPart3';
import { defaultBudgetPaymentMilestones } from './budgetMilestones';
import { defaultBudgetChecklistTasks } from './budgetChecklist';

export { defaultBudgetCategories, defaultBudgetParameters, defaultBudgetPaymentMilestones, defaultBudgetChecklistTasks };
export const defaultBudgetItems: BudgetItem[] = [...defaultBudgetItemsPart1, ...defaultBudgetItemsPart2, ...defaultBudgetItemsPart3];

export function createDefaultBudgetWorkbook(options: { includeItems?: boolean; includeChecklist?: boolean } = {}): { budget: BudgetData; checklistTasks: WeddingTask[] } {
  return {
    budget: {
      workbookVersion: 5,
      params: { guestCount: 280, tableCount: 32, seatsPerTable: 10, bufferRate: 0.1, weddingDays: 1, totalBudgetCap: 100000 },
      categories: structuredClone(defaultBudgetCategories),
      parameters: structuredClone(defaultBudgetParameters),
      items: options.includeItems === false ? [] : structuredClone(defaultBudgetItems),
      paymentMilestones: options.includeItems === false ? [] : structuredClone(defaultBudgetPaymentMilestones)
    },
    checklistTasks: options.includeChecklist === false ? [] : structuredClone(defaultBudgetChecklistTasks)
  };
}
