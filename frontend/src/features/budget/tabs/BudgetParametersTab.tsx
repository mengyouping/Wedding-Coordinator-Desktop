import { useState } from 'react';
import { Icon } from '../../../components/Icon';
import { useWeddingData } from '../../../state/WeddingDataProvider';
import type { BudgetParameter, ResolvedBudgetWorkbook } from '../../../types/budgetWorkbook';
import { BudgetSourceBadge } from '../components/BudgetSourceBadge';

const legacyParamKeys: Record<string, 'totalBudgetCap' | 'guestCount' | 'tableCount' | 'seatsPerTable' | 'bufferRate' | 'weddingDays'> = {
  'budget.totalCap': 'totalBudgetCap',
  'guest.invitedCount': 'guestCount',
  'table.totalCount': 'tableCount',
  'table.seatsPerTable': 'seatsPerTable',
  'risk.reserveRate': 'bufferRate',
  'wedding.days': 'weddingDays'
};

function displayValue(parameter: BudgetParameter, value: number | boolean | string): string {
  if (typeof value === 'boolean') return value ? '是' : '否';
  if (typeof value === 'number' && parameter.unit === '%') return `${Math.round(value * 10000) / 100}%`;
  return String(value);
}

export function BudgetParametersTab({ workbook }: { workbook: ResolvedBudgetWorkbook }) {
  const { data, updateDatabase, can } = useWeddingData();
  const [group, setGroup] = useState('全部');
  if (!data) return null;
  const writable = can('budget.write');
  const groups = ['全部', ...new Set(workbook.parameters.map(item => item.group))];
  const visible = group === '全部' ? workbook.parameters : workbook.parameters.filter(item => item.group === group);

  const patch = (key: string, value: number | boolean | string) => updateDatabase(database => {
    const parameters = (database.budget.parameters ?? []).map(item => item.key === key ? { ...item, value } : item);
    const legacyKey = legacyParamKeys[key];
    const legacyParams = legacyKey && typeof value === 'number'
      ? { ...database.budget.params, [legacyKey]: Math.max(0, value) }
      : database.budget.params;
    return { ...database, budget: { ...database.budget, parameters, params: legacyParams } };
  });

  return <div className="budget-tab-content budget-parameters-tab">
    <section className="panel budget-parameter-intro">
      <div><Icon name="settings" /><div><span className="eyebrow">PARAMETER MODEL</span><h2>预算参数与公式来源</h2><p>黄色字段由总指挥输入；绿色字段由宾客、参数或公式自动生成。修改参数后，三级预算项目和分类占比立即联动。</p></div></div>
      <div className="budget-legend"><span><i className="legend-dot legend-dot--manual" />黄色：允许输入</span><span><i className="legend-dot legend-dot--auto" />绿色：自动生成</span></div>
    </section>

    <section className="toolbar panel budget-parameter-filter">
      <div className="tabs">{groups.map(value => <button key={value} className={group === value ? 'is-active' : ''} onClick={() => setGroup(value)}>{value}</button>)}</div>
      <span>{visible.length} 个参数 · {workbook.parameters.filter(item => item.mode === 'manual').length} 个手工输入</span>
    </section>

    <section className="budget-parameter-grid">
      {visible.map(parameter => <article className={`panel budget-parameter-card ${parameter.mode === 'manual' ? 'is-manual' : 'is-auto'}`} key={parameter.id}>
        <header><div><span>{parameter.group}</span><strong>{parameter.name}</strong></div><BudgetSourceBadge label={parameter.mode === 'manual' ? '手工输入' : parameter.mode === 'linked' ? '来自业务数据' : '公式计算'} title={parameter.formulaDescription} /></header>
        <div className="budget-parameter-card__value">
          {parameter.mode === 'manual' && parameter.valueType === 'boolean'
            ? <label className="budget-toggle"><input type="checkbox" disabled={!writable} checked={Boolean(parameter.value)} onChange={event => patch(parameter.key, event.target.checked)} /><span>{Boolean(parameter.value) ? '已纳入' : '未纳入'}</span></label>
            : parameter.mode === 'manual'
              ? <div className="budget-parameter-input"><input disabled={!writable} type={parameter.valueType === 'number' ? 'number' : 'text'} step={parameter.unit === '%' ? '0.01' : '1'} value={String(parameter.value)} onChange={event => patch(parameter.key, parameter.valueType === 'number' ? Number(event.target.value) : event.target.value)} /><b>{parameter.unit}</b></div>
              : <strong>{displayValue(parameter, parameter.resolvedValue)} <small>{parameter.unit === '%' ? '' : parameter.unit}</small></strong>}
        </div>
        <p>{parameter.description}</p>
        <footer><span>{parameter.formulaDescription}</span><small>Key: {parameter.key}</small></footer>
      </article>)}
    </section>

    <section className="panel budget-formula-reference">
      <header><div><span className="eyebrow">FORMULA REFERENCE</span><h2>核心联动规则</h2></div></header>
      <div className="budget-formula-list">
        <div><strong>计划正桌数</strong><code>ceil((预计宾客人数 + 备用人数) / 每桌人数)</code></div>
        <div><strong>计划总桌数</strong><code>计划正桌数 + 备用桌数</code></div>
        <div><strong>伴手礼数量</strong><code>ceil(预计宾客人数 × 105%)</code></div>
        <div><strong>酒店服务费</strong><code>(婚宴正桌 + 备用桌) × 服务费率</code></div>
        <div><strong>风险预留</strong><code>其他已纳入预算项目合计 × 风险预留比例</code></div>
      </div>
    </section>
  </div>;
}
