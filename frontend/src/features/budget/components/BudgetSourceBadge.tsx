export function BudgetSourceBadge({ label, title }: { label: string; title?: string }) {
  const automatic = /参数|公式|业务|合同|流水|报价/.test(label);
  return <span className={`budget-source-badge ${automatic ? 'is-auto' : 'is-manual'}`} title={title ?? label}>{label}</span>;
}
