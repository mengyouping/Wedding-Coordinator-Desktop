import type { FinancialTransaction, WeddingDatabase } from '../../types/domain';

const round = (value: number): number => Math.round(value * 100) / 100;

export function signedTransactionAmount(transaction: FinancialTransaction): number {
  if (transaction.type === '退款') return -transaction.amount;
  return transaction.amount;
}

/**
 * 以 FinancialTransaction 作为实际资金唯一事实源，原子投影预算、供应商、报价和合同引用。
 * Vendor.payments 仅代表计划节点，不再决定实际已付款金额。
 */
export function applyFinancialProjection(database: WeddingDatabase): WeddingDatabase {
  const selectedQuoteByBudget = new Map(
    database.quotes.filter(item => item.selected).map(item => [item.budgetItemId, item])
  );
  const activeContracts = database.contracts.filter(item => item.status !== '已终止');
  const contractById = new Map(activeContracts.map(item => [item.id, item]));
  const contractByBudget = new Map<string, typeof activeContracts[number]>();
  for (const contract of activeContracts) {
    for (const budgetItemId of contract.budgetItemIds) {
      if (!contractByBudget.has(budgetItemId)) contractByBudget.set(budgetItemId, contract);
    }
  }

  const actualByBudget = new Map<string, number>();
  const paidByVendor = new Map<string, number>();
  for (const transaction of database.transactions) {
    const signed = signedTransactionAmount(transaction);
    if (transaction.budgetItemId) {
      actualByBudget.set(transaction.budgetItemId, round((actualByBudget.get(transaction.budgetItemId) ?? 0) + signed));
    }
    const inferredVendorId = transaction.vendorId || (transaction.contractId ? contractById.get(transaction.contractId)?.vendorId : undefined);
    if (inferredVendorId) {
      paidByVendor.set(inferredVendorId, round((paidByVendor.get(inferredVendorId) ?? 0) + signed));
    }
  }

  const contractValueByVendor = new Map<string, number>();
  for (const contract of activeContracts) {
    contractValueByVendor.set(contract.vendorId, round((contractValueByVendor.get(contract.vendorId) ?? 0) + contract.amount));
  }

  const budget = {
    ...database.budget,
    items: database.budget.items.map(item => {
      const quote = selectedQuoteByBudget.get(item.id);
      const contract = contractByBudget.get(item.id);
      return {
        ...item,
        actualAmount: Math.max(0, round(actualByBudget.get(item.id) ?? 0)),
        quoteId: quote?.id ?? '',
        contractId: contract?.id ?? '',
        vendorId: contract?.vendorId ?? quote?.vendorId ?? ''
      };
    })
  };

  const vendors = database.vendors.map(vendor => ({
    ...vendor,
    contractAmount: round(contractValueByVendor.get(vendor.id) ?? 0),
    paidAmount: Math.max(0, round(paidByVendor.get(vendor.id) ?? 0)),
    quoteIds: database.quotes.filter(item => item.vendorId === vendor.id).map(item => item.id),
    contractIds: activeContracts.filter(item => item.vendorId === vendor.id).map(item => item.id)
  }));

  return { ...database, budget, vendors };
}
