import { Icon } from '../../../components/Icon';
import { currency } from '../../../lib/format';
import type { ResolvedBudgetWorkbook } from '../../../types/budgetWorkbook';

export function BudgetOverviewTab({ workbook, onOpenCategory }: { workbook: ResolvedBudgetWorkbook; onOpenCategory: (categoryId: string) => void }) {
  const usage = workbook.totalBudgetCap ? workbook.totalPlanned / workbook.totalBudgetCap : 0;
  const actualUsage = workbook.totalBudgetCap ? workbook.totalActual / workbook.totalBudgetCap : 0;
  const cards = [
    ['总预算红线', workbook.totalBudgetCap, '参数模型中的资金硬上限'],
    ['计划预算', workbook.totalPlanned, `占用 ${Math.round(usage * 100)}%`],
    ['实际支出', workbook.totalActual, `已付款占红线 ${Math.round(actualUsage * 100)}%`],
    ['待付款', workbook.totalOutstanding, '计划预算减已付款'],
    ['剩余额度', workbook.remainingBudget, workbook.remainingBudget >= 0 ? '仍在预算红线内' : '已经突破预算红线'],
    ['风险预留', workbook.riskReserve, '仅用于突发事项']
  ] as const;

  return <div className="budget-tab-content budget-overview-tab">
    <section className="budget-control-grid">
      {cards.map(([label, value, note], index) => <article className={`panel budget-control-card ${value < 0 ? 'is-danger' : ''}`} key={label}>
        <span>{label}</span>
        <strong>{currency.format(value)}</strong>
        <small>{note}</small>
        {index === 1 && <div className="budget-control-progress"><i><b style={{ width: `${Math.min(100, Math.max(2, usage * 100))}%` }} /></i></div>}
      </article>)}
    </section>

    <section className="panel budget-category-control">
      <header>
        <div><span className="eyebrow">CATEGORY CONTROL</span><h2>一级分类预算结构</h2></div>
        <div className="budget-legend"><span><i className="legend-dot legend-dot--manual" />黄色可输入</span><span><i className="legend-dot legend-dot--auto" />绿色自动计算</span></div>
      </header>
      <div className="table-scroll">
        <table className="data-table budget-category-summary-table">
          <thead><tr><th>一级分类</th><th>建议占比</th><th>计划预算</th><th>实际支出</th><th>已付款</th><th>待付款</th><th>当前占比</th><th>风险判断</th><th>总控提示</th><th /></tr></thead>
          <tbody>{workbook.categorySummaries.map(row => <tr key={row.categoryId}>
            <td><strong>{row.categoryName}</strong></td>
            <td>{Math.round(row.recommendedMinRate * 100)}%—{Math.round(row.recommendedMaxRate * 100)}%</td>
            <td className="budget-cell--auto">{currency.format(row.planned)}</td>
            <td className="budget-cell--auto">{currency.format(row.actual)}</td>
            <td className="budget-cell--auto">{currency.format(row.paid)}</td>
            <td className="budget-cell--auto">{currency.format(row.outstanding)}</td>
            <td><div className="budget-share-cell"><i><b style={{ width: `${Math.min(100, row.share * 100)}%` }} /></i><span>{Math.round(row.share * 100)}%</span></div></td>
            <td><span className={`budget-risk-tag budget-risk-tag--${row.risk === '在建议区间' ? 'ok' : row.risk === '超建议上限' ? 'danger' : 'warning'}`}>{row.risk}</span></td>
            <td><small>{row.guidance}</small></td>
            <td><button className="icon-button" aria-label={`查看${row.categoryName}明细`} onClick={() => onOpenCategory(row.categoryId)}><Icon name="arrow" /></button></td>
          </tr>)}</tbody>
        </table>
      </div>
    </section>

    <section className="budget-overview-insights">
      <article className="panel"><Icon name="warning" /><div><strong>预算红线</strong><p>{usage > 1 ? `计划预算已超红线 ${currency.format(workbook.totalPlanned - workbook.totalBudgetCap)}，必须压缩分类或提高预算上限。` : `计划预算仍有 ${currency.format(workbook.totalBudgetCap - workbook.totalPlanned)} 的计划空间。`}</p></div></article>
      <article className="panel"><Icon name="finance" /><div><strong>付款节奏</strong><p>付款节点只代表计划，实际支出仍由财务流水自动汇总，避免合同、预算和付款三套金额不一致。</p></div></article>
      <article className="panel"><Icon name="risk" /><div><strong>风险预留</strong><p>当前风险预留 {currency.format(workbook.riskReserve)}，建议只用于临时加桌、设备、交通和突发物料。</p></div></article>
    </section>
  </div>;
}
