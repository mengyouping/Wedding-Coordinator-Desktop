interface VendorReferenceSnapshot {
  quotes: Array<{ id: string; vendorId: string }>;
  contracts: Array<{ id: string; vendorId: string }>;
  transactions: Array<{ id: string; vendorId?: string; contractId?: string }>;
}

export function vendorDeletionBlockers(
  data: VendorReferenceSnapshot,
  vendorId: string
): string[] {
  const contractIds = new Set(data.contracts.filter(item => item.vendorId === vendorId).map(item => item.id));
  const quoteCount = data.quotes.filter(item => item.vendorId === vendorId).length;
  const contractCount = contractIds.size;
  const transactionCount = data.transactions.filter(item => item.vendorId === vendorId || Boolean(item.contractId && contractIds.has(item.contractId))).length;
  const blockers: string[] = [];
  if (quoteCount) blockers.push(`${quoteCount} 条供应商报价`);
  if (contractCount) blockers.push(`${contractCount} 份合同`);
  if (transactionCount) blockers.push(`${transactionCount} 条资金流水`);
  return blockers;
}