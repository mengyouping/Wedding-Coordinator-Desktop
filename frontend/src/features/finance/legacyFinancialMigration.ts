import type { ContractRecord, FinancialTransaction, WeddingDatabase } from '../../types/domain';

const stableId = (prefix: string, ...parts: string[]): string => `${prefix}-${parts.join('-').replace(/[^a-zA-Z0-9_-]+/g, '-')}`;

/**
 * 把旧版 Vendor.contractAmount / Vendor.payments 与已支付预算实际额一次性转换为中央合同和交易事实。
 * 生成 ID 完全确定，重复加载不会产生重复记录。
 */
export function migrateLegacyFinancialFacts(database: WeddingDatabase): WeddingDatabase {
  const contracts = [...database.contracts];
  const transactions = [...database.transactions];
  const contractIds = new Set(contracts.map(item => item.id));
  const transactionIds = new Set(transactions.map(item => item.id));

  for (const vendor of database.vendors) {
    const selectedQuotes = database.quotes.filter(item => item.vendorId === vendor.id && item.selected);
    let vendorContracts = contracts.filter(item => item.vendorId === vendor.id);

    if (!vendorContracts.length && vendor.contractAmount > 0) {
      const contractId = stableId('legacy-contract', vendor.id);
      const contract: ContractRecord = {
        id: contractId,
        vendorId: vendor.id,
        budgetItemIds: [...new Set(selectedQuotes.map(item => item.budgetItemId).filter(Boolean))],
        title: `${vendor.name}历史合同`,
        amount: vendor.contractAmount,
        signedAt: (vendor.payments ?? []).map(item => item.dueDate).filter(Boolean).sort()[0] ?? '',
        status: vendor.status === '已完成' ? '已完成' : vendor.status === '执行中' ? '履约中' : '草稿',
        attachmentIds: [],
        note: '由旧供应商合同金额迁移生成'
      };
      if (!contractIds.has(contractId)) {
        contracts.push(contract);
        contractIds.add(contractId);
      }
      vendorContracts = [contract];
    }

    const existingVendorTransactions = transactions.filter(item =>
      item.vendorId === vendor.id || Boolean(item.contractId && vendorContracts.some(contract => contract.id === item.contractId))
    );
    if (existingVendorTransactions.length) continue;

    const primaryContract = vendorContracts[0];
    const primaryBudgetItemId = primaryContract?.budgetItemIds[0] ?? selectedQuotes[0]?.budgetItemId ?? '';
    const paidPlans = (vendor.payments ?? []).filter(item => item.status === '已支付' && item.amount > 0);

    if (paidPlans.length) {
      for (const payment of paidPlans) {
        const transactionId = stableId('legacy-payment', vendor.id, payment.id);
        if (transactionIds.has(transactionId)) continue;
        const transaction: FinancialTransaction = {
          id: transactionId,
          contractId: primaryContract?.id ?? '',
          vendorId: vendor.id,
          budgetItemId: primaryBudgetItemId,
          type: '付款',
          amount: payment.amount,
          occurredAt: payment.dueDate,
          invoiceStatus: payment.invoiceStatus,
          note: `由旧付款节点“${payment.title}”迁移生成`
        };
        transactions.push(transaction);
        transactionIds.add(transactionId);
      }
    } else if (vendor.paidAmount > 0) {
      const transactionId = stableId('legacy-payment', vendor.id, 'total');
      if (!transactionIds.has(transactionId)) {
        transactions.push({
          id: transactionId,
          contractId: primaryContract?.id ?? '',
          vendorId: vendor.id,
          budgetItemId: primaryBudgetItemId,
          type: '付款',
          amount: vendor.paidAmount,
          occurredAt: vendor.nextPaymentDate || '',
          invoiceStatus: '未开票',
          note: '由旧供应商已付款总额迁移生成'
        });
        transactionIds.add(transactionId);
      }
    }
  }

  const budgetItemsWithTransactions = new Set(transactions.map(item => item.budgetItemId).filter(Boolean));
  for (const item of database.budget.items) {
    if (item.status !== 'paid' || item.actualAmount <= 0 || budgetItemsWithTransactions.has(item.id)) continue;
    const transactionId = stableId('legacy-budget-payment', item.id);
    if (transactionIds.has(transactionId)) continue;
    transactions.push({
      id: transactionId,
      contractId: item.contractId ?? '',
      vendorId: item.vendorId ?? '',
      budgetItemId: item.id,
      type: '付款',
      amount: item.actualAmount,
      occurredAt: database.updatedAt.slice(0, 10),
      invoiceStatus: '未开票',
      note: `由已支付预算项“${item.name}”历史实际额迁移生成`
    });
    transactionIds.add(transactionId);
    budgetItemsWithTransactions.add(item.id);
  }

  return { ...database, contracts, transactions };
}
