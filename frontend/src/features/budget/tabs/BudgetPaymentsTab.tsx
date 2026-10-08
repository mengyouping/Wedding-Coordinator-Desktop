import { Icon } from '../../../components/Icon';
import { currency } from '../../../lib/format';
import { createId } from '../../../lib/id';
import { useWeddingData } from '../../../state/WeddingDataProvider';
import type { FinancialTransaction } from '../../../types/domain';
import type { BudgetPaymentMilestone, ResolvedBudgetWorkbook } from '../../../types/budgetWorkbook';

const signed = (row: FinancialTransaction): number => row.type === '退款' ? -row.amount : row.amount;

function allocateActual(workbook: ResolvedBudgetWorkbook, milestones: BudgetPaymentMilestone[]): Map<string, number> {
  const result = new Map<string, number>();
  const categoryPaid = new Map<string, number>();
  for (const item of workbook.items) categoryPaid.set(item.categoryId ?? '', (categoryPaid.get(item.categoryId ?? '') ?? 0) + item.paidAmount);
  const grouped = new Map<string, BudgetPaymentMilestone[]>();
  for (const row of milestones.slice().sort((a, b) => a.sortOrder - b.sortOrder)) grouped.set(row.categoryId, [...(grouped.get(row.categoryId) ?? []), row]);
  for (const [categoryId, rows] of grouped) {
    let remaining = Math.max(0, categoryPaid.get(categoryId) ?? 0);
    for (const row of rows) {
      const allocated = Math.min(Math.max(0, row.plannedAmount), remaining);
      result.set(row.id, allocated);
      remaining -= allocated;
    }
  }
  return result;
}

export function BudgetPaymentsTab({ workbook }: { workbook: ResolvedBudgetWorkbook }) {
  const { data, updateDatabase, can } = useWeddingData();
  if (!data) return null;
  const writable = can('budget.write');
  const milestones = (data.budget.paymentMilestones ?? []).slice().sort((a, b) => a.sortOrder - b.sortOrder);
  const allocatedActual = allocateActual(workbook, milestones);
  const categories = (data.budget.categories ?? []).filter(item => item.level === 1);

  const directActual = (row: BudgetPaymentMilestone): number => {
    if (row.budgetItemId) return workbook.items.find(item => item.id === row.budgetItemId)?.paidAmount ?? 0;
    if (row.contractId) return data.transactions.filter(item => item.contractId === row.contractId).reduce((sum, item) => sum + signed(item), 0);
    return allocatedActual.get(row.id) ?? 0;
  };
  const patch = (id: string, value: Partial<BudgetPaymentMilestone>) => updateDatabase(database => ({
    ...database,
    budget: { ...database.budget, paymentMilestones: (database.budget.paymentMilestones ?? []).map(item => item.id === id ? { ...item, ...value } : item) }
  }));
  const add = () => updateDatabase(database => {
    const firstCategory = (database.budget.categories ?? []).find(item => item.level === 1);
    const created: BudgetPaymentMilestone = {
      id: createId('milestone'), categoryId: firstCategory?.id ?? '', budgetItemId: '', vendorName: '', contractId: '',
      title: '新增付款节点', recommendedTiming: '待设置', plannedDate: '', ratio: 0, plannedAmount: 0,
      triggerCondition: '', acceptanceCriteria: '', ownerName: '总指挥', collaboratorNames: [], status: '待支付',
      sortOrder: (database.budget.paymentMilestones ?? []).length + 1
    };
    return { ...database, budget: { ...database.budget, paymentMilestones: [...(database.budget.paymentMilestones ?? []), created] } };
  });
  const remove = (id: string) => updateDatabase(database => ({
    ...database,
    budget: { ...database.budget, paymentMilestones: (database.budget.paymentMilestones ?? []).filter(item => item.id !== id) }
  }));

  const plannedTotal = milestones.reduce((sum, item) => sum + item.plannedAmount, 0);
  const actualTotal = data.transactions.reduce((sum, item) => sum + signed(item), 0);
  const overdue = milestones.filter(item => item.status === '已逾期').length;

  return <div className="budget-tab-content budget-payments-tab">
    <section className="budget-control-grid budget-payment-stats">
      <article className="panel budget-control-card"><span>计划付款</span><strong>{currency.format(plannedTotal)}</strong><small>{milestones.length} 个付款节点</small></article>
      <article className="panel budget-control-card"><span>实际净付款</span><strong>{currency.format(actualTotal)}</strong><small>来自 FinancialTransaction</small></article>
      <article className="panel budget-control-card"><span>计划待付</span><strong>{currency.format(Math.max(0, plannedTotal - actualTotal))}</strong><small>付款计划减真实流水</small></article>
      <article className={`panel budget-control-card ${overdue ? 'is-danger' : ''}`}><span>逾期节点</span><strong>{overdue}</strong><small>{overdue ? '需要立即处理' : '当前无逾期'}</small></article>
    </section>

    <section className="panel budget-payment-workbook">
      <header className="budget-detail-toolbar"><div><span className="eyebrow">PAYMENT PLAN</span><h2>付款计划与合同验收</h2><p>黄色字段为计划输入；绿色“实际支付”只从真实财务流水分配，不允许手填。</p></div>{writable && <button className="button" onClick={add}><Icon name="plus" />新增付款节点</button>}</header>
      <div className="table-scroll"><table className="data-table budget-payment-table">
        <thead><tr><th>一级分类</th><th>预算项目</th><th>供应商</th><th>合同</th><th>付款阶段</th><th>建议时间点</th><th>计划日期</th><th>比例</th><th>计划金额</th><th>实际支付</th><th>差异</th><th>验收/触发条件</th><th>负责人</th><th>协同人</th><th>状态</th><th /></tr></thead>
        <tbody>{milestones.map(row => {
          const actual = directActual(row);
          const difference = actual - row.plannedAmount;
          return <tr key={row.id}>
            <td className="budget-cell--manual"><select disabled={!writable} value={row.categoryId} onChange={event => patch(row.id, { categoryId: event.target.value, budgetItemId: '' })}>{categories.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></td>
            <td className="budget-cell--manual"><select disabled={!writable} value={row.budgetItemId ?? ''} onChange={event => {
              const item = data.budget.items.find(value => value.id === event.target.value);
              patch(row.id, { budgetItemId: event.target.value, categoryId: item?.categoryId ?? row.categoryId });
            }}><option value="">按分类分配</option>{data.budget.items.filter(item => item.categoryId === row.categoryId).map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></td>
            <td className="budget-cell--manual"><input disabled={!writable} value={row.vendorName} onChange={event => patch(row.id, { vendorName: event.target.value })} /></td>
            <td className="budget-cell--manual"><select disabled={!writable} value={row.contractId ?? ''} onChange={event => patch(row.id, { contractId: event.target.value })}><option value="">未关联合同</option>{data.contracts.map(item => <option key={item.id} value={item.id}>{item.title}</option>)}</select></td>
            <td className="budget-cell--manual"><input disabled={!writable} value={row.title} onChange={event => patch(row.id, { title: event.target.value })} /></td>
            <td className="budget-cell--manual"><input disabled={!writable} value={row.recommendedTiming} onChange={event => patch(row.id, { recommendedTiming: event.target.value })} /></td>
            <td className="budget-cell--manual"><input type="date" disabled={!writable} value={row.plannedDate ?? ''} onChange={event => patch(row.id, { plannedDate: event.target.value })} /></td>
            <td className="budget-cell--manual"><input type="number" min="0" max="100" disabled={!writable} value={Math.round(row.ratio * 100)} onChange={event => patch(row.id, { ratio: Number(event.target.value) / 100 })} /><small>%</small></td>
            <td className="budget-cell--manual"><input type="number" min="0" disabled={!writable} value={row.plannedAmount} onChange={event => patch(row.id, { plannedAmount: Number(event.target.value) })} /></td>
            <td className="budget-cell--auto"><strong>{currency.format(actual)}</strong></td>
            <td className={difference > 0 ? 'variance-positive' : 'variance-negative'}>{currency.format(difference)}</td>
            <td className="budget-cell--manual"><textarea disabled={!writable} value={row.acceptanceCriteria || row.triggerCondition} onChange={event => patch(row.id, { acceptanceCriteria: event.target.value, triggerCondition: event.target.value })} /></td>
            <td className="budget-cell--manual"><input disabled={!writable} value={row.ownerName} onChange={event => patch(row.id, { ownerName: event.target.value })} /></td>
            <td className="budget-cell--manual"><input disabled={!writable} value={row.collaboratorNames.join('、')} onChange={event => patch(row.id, { collaboratorNames: event.target.value.split(/[、,，]/).map(value => value.trim()).filter(Boolean) })} /></td>
            <td><select disabled={!writable} value={row.status} onChange={event => patch(row.id, { status: event.target.value as BudgetPaymentMilestone['status'] })}><option>待支付</option><option>已支付</option><option>已逾期</option><option>已取消</option></select></td>
            <td><button className="icon-button icon-button--danger" disabled={!writable} aria-label={`删除付款节点 ${row.title}`} onClick={() => remove(row.id)}><Icon name="trash" /></button></td>
          </tr>;
        })}</tbody>
      </table></div>
    </section>
  </div>;
}
