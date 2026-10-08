import './domain';
import type {
  BudgetCalculationRule,
  BudgetCategory,
  BudgetParameter,
  BudgetPaymentMilestone,
  BudgetQuantitySource,
  BudgetUnitPriceSource
} from './budgetWorkbook';

declare module './domain' {
  interface ConflictRecord {
    /** 产生该冲突的 Outbox 命令，用于真实重试、放弃或采用服务端。 */
    outboxId?: string;
  }

  interface BudgetData {
    /** 预算工作簿子模型版本；根 WeddingDatabase 保持现有兼容版本。 */
    workbookVersion?: 5;
    categories?: BudgetCategory[];
    parameters?: BudgetParameter[];
    paymentMilestones?: BudgetPaymentMilestone[];
  }

  interface BudgetItem {
    categoryId?: string;
    secondaryCategoryId?: string;
    sortOrder?: number;
    included?: boolean;
    inclusionParameterKey?: string;
    quantitySource?: BudgetQuantitySource;
    quantityParameterKey?: string;
    unitPriceSource?: BudgetUnitPriceSource;
    unitPriceParameterKey?: string;
    calculationRule?: BudgetCalculationRule;
    paymentTerms?: string;
    latestConfirm?: string;
    ownerMemberId?: string;
    collaboratorMemberIds?: string[];
    acceptanceCriteria?: string;
    riskTip?: string;
  }

  interface WeddingTask {
    collaborators?: string[];
    budgetCategoryId?: string;
    budgetItemId?: string;
    acceptanceCriteria?: string;
    stageCode?: string;
    sortOrder?: number;
    source?: 'general' | 'budget';
    parentTaskId?: string;
    contractId?: string;
  }
}
