import { useState } from 'react';
import { Icon } from '../../../components/Icon';
import { currency } from '../../../lib/format';
import { createId } from '../../../lib/id';
import { useWeddingData } from '../../../state/WeddingDataProvider';
import type { BudgetItem, BudgetStatus } from '../../../types/domain';
import type { BudgetCategory, ResolvedBudgetWorkbook } from '../../../types/budgetWorkbook';
import { BudgetSourceBadge } from '../components/BudgetSourceBadge';
import { applyFinancialProjection } from '../../finance/financialProjection';

export type BudgetDetailView = 'amount' | 'contract' | 'execution';
const statusLabels: Record<BudgetStatus, string> = { planned: '计划中', quoted: '已报价', confirmed: '已确认', paid: '已支付' };

function nextSortOrder(items: BudgetItem[]): number {
  return Math.max(0, ...items.map(item => item.sortOrder ?? 0)) + 1;
}

export function BudgetDetailTab({ workbook, selectedCategoryId, onSelectCategory }: {
  workbook: ResolvedBudgetWorkbook;
  selectedCategoryId: string;
  onSelectCategory: (categoryId: string) => void;
}) {
  const { data, updateDatabase, can } = useWeddingData();
  const [view, setView] = useState<BudgetDetailView>('amount');
  if (!data) return null;
  const writable = can('budget.write');
  const deleteWritable = writable && can('execution.write');
  const categories = (data.budget.categories ?? []).filter(item => item.enabled).sort((a, b) => a.sortOrder - b.sortOrder);
  const primaries = categories.filter(item => item.level === 1);
  const selected = categories.find(item => item.id === selectedCategoryId) ?? primaries[0];
  const visibleItems = workbook.items.filter(item => {
    if (!selectedCategoryId || !selected) return true;
    return selected.level === 1 ? item.categoryId === selected.id : item.secondaryCategoryId === selected.id;
  });

  const patchItem = (id: string, patch: Partial<BudgetItem>) => {
    if (!writable) return;
    updateDatabase(database => applyFinancialProjection({
      ...database,
      budget: { ...database.budget, items: database.budget.items.map(item => item.id === id ? { ...item, ...patch } : item) }
    }));
  };

  const insertItem = (after?: BudgetItem) => {
    if (!writable) return;
    updateDatabase(database => {
      const allCategories = database.budget.categories ?? [];
      const selectedCategory = allCategories.find(item => item.id === (after?.secondaryCategoryId || selected?.id));
      const secondary = selectedCategory?.level === 2
        ? selectedCategory
        : allCategories.filter(item => item.level === 2 && item.parentId === (after?.categoryId || selectedCategory?.id)).sort((a, b) => a.sortOrder - b.sortOrder)[0];
      const primary = allCategories.find(item => item.id === (after?.categoryId || secondary?.parentId || selectedCategory?.id));
      if (!primary || !secondary) return database;
      const order = after?.sortOrder !== undefined ? after.sortOrder + 0.5 : nextSortOrder(database.budget.items);
      const created: BudgetItem = {
        id: createId('budget'), category: primary.name, categoryId: primary.id, secondaryCategoryId: secondary.id,
        name: '新增预算项目', unit: '项', unitPrice: 0, quantity: 1, quantityMode: 'fixed',
        quantitySource: 'manual', quantityParameterKey: '', unitPriceSource: 'manual', unitPriceParameterKey: '',
        calculationRule: 'multiply', included: true, inclusionParameterKey: '', includeBuffer: false,
        actualAmount: 0, status: 'planned', note: '', paymentTerms: '', latestConfirm: '', ownerMemberId: '',
        collaboratorMemberIds: [], acceptanceCriteria: '', riskTip: '', sortOrder: order
      };
      const normalized = [...database.budget.items, created]
        .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
        .map((item, index) => ({ ...item, sortOrder: index + 1 }));
      return { ...database, budget: { ...database.budget, items: normalized } };
    });
  };

  const duplicateItem = (item: BudgetItem) => {
    if (!writable) return;
    updateDatabase(database => {
      const created: BudgetItem = {
        ...structuredClone(item), id: createId('budget'), name: `${item.name}副本`, actualAmount: 0,
        vendorId: '', quoteId: '', contractId: '', sortOrder: (item.sortOrder ?? 0) + 0.5
      };
      const items = [...database.budget.items, created]
        .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
        .map((row, index) => ({ ...row, sortOrder: index + 1 }));
      return { ...database, budget: { ...database.budget, items } };
    });
  };

  const moveItem = (item: BudgetItem, offset: -1 | 1) => {
    if (!writable) return;
    updateDatabase(database => {
      const ordered = database.budget.items.slice().sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
      const index = ordered.findIndex(row => row.id === item.id);
      const targetIndex = index + offset;
      const current = ordered[index];
      const target = ordered[targetIndex];
      if (!current || !target) return database;
      ordered[index] = target;
      ordered[targetIndex] = current;
      return { ...database, budget: { ...database.budget, items: ordered.map((row, order) => ({ ...row, sortOrder: order + 1 })) } };
    });
  };

  const removeItem = (id: string) => {
    if (!deleteWritable) return;
    if (!window.confirm('删除预算项会同步清理付款节点、报价引用、合同引用、财务引用和任务引用，确认继续吗？')) return;
    updateDatabase(database => applyFinancialProjection({
      ...database,
      budget: {
        ...database.budget,
        items: database.budget.items.filter(item => item.id !== id),
        paymentMilestones: (database.budget.paymentMilestones ?? []).filter(item => item.budgetItemId !== id)
      },
      quotes: database.quotes.filter(item => item.budgetItemId !== id),
      contracts: database.contracts.map(item => ({ ...item, budgetItemIds: item.budgetItemIds.filter(value => value !== id) })),
      transactions: database.transactions.map(item => item.budgetItemId === id ? { ...item, budgetItemId: '' } : item),
      tasks: database.tasks.map(item => item.budgetItemId === id ? { ...item, budgetItemId: '', budgetCategoryId: '', source: 'general' } : item)
    }));
  };

  const addSecondary = (primary: BudgetCategory) => {
    if (!writable) return;
    const name = window.prompt(`在“${primary.name}”下新增二级分类`, '新增二级分类')?.trim();
    if (!name) return;
    updateDatabase(database => {
      const list = database.budget.categories ?? [];
      const created: BudgetCategory = {
        id: createId('budget-category'), parentId: primary.id, level: 2, name, code: `CUSTOM-${Date.now()}`,
        sortOrder: list.filter(item => item.parentId === primary.id).length + 1, enabled: true
      };
      return { ...database, budget: { ...database.budget, categories: [...list, created] } };
    });
  };

  const renameCategory = (category: BudgetCategory) => {
    if (!writable) return;
    const name = window.prompt('修改分类名称', category.name)?.trim();
    if (!name || name === category.name) return;
    updateDatabase(database => ({
      ...database,
      budget: {
        ...database.budget,
        categories: (database.budget.categories ?? []).map(item => item.id === category.id ? { ...item, name } : item),
        items: database.budget.items.map(item => item.categoryId === category.id ? { ...item, category: name } : item)
      }
    }));
  };

  return <div className="budget-tab-content budget-detail-layout">
    <aside className="panel budget-category-tree">
      <header><div><span className="eyebrow">CATEGORY TREE</span><h2>预算分类</h2></div><small>一级 / 二级</small></header>
      <button className={!selectedCategoryId ? 'is-active' : ''} onClick={() => onSelectCategory('')}><strong>全部预算</strong><span>{workbook.items.length}</span></button>
      {primaries.map(primary => <div className="budget-category-tree__group" key={primary.id}>
        <div className="budget-category-tree__primary">
          <button className={selected?.id === primary.id ? 'is-active' : ''} onClick={() => onSelectCategory(primary.id)}><strong>{primary.name}</strong><span>{workbook.items.filter(item => item.categoryId === primary.id).length}</span></button>
          {writable && <button className="icon-button" aria-label={`在${primary.name}下新增分类`} onClick={() => addSecondary(primary)}><Icon name="plus" /></button>}
        </div>
        <div className="budget-category-tree__children">{categories.filter(item => item.parentId === primary.id).map(child => <div key={child.id}>
          <button className={selected?.id === child.id ? 'is-active' : ''} onClick={() => onSelectCategory(child.id)}><span>{child.name}</span><b>{workbook.items.filter(item => item.secondaryCategoryId === child.id).length}</b></button>
          {writable && <button className="icon-button" aria-label={`重命名${child.name}`} onClick={() => renameCategory(child)}><Icon name="edit" /></button>}
        </div>)}</div>
      </div>)}
    </aside>

    <section className="panel budget-detail-workbook">
      <header className="budget-detail-toolbar">
        <div><span className="eyebrow">BUDGET DETAIL</span><h2>{selected?.name ?? '全部预算'} · {visibleItems.length} 项</h2></div>
        <div className="budget-detail-toolbar__actions">
          <div className="tabs">{([['amount','金额视图'],['contract','合同视图'],['execution','执行视图']] as const).map(([id,label]) => <button key={id} className={view === id ? 'is-active' : ''} onClick={() => setView(id)}>{label}</button>)}</div>
          {writable && <button className="button" onClick={() => insertItem()}><Icon name="plus" />新增预算项</button>}
        </div>
      </header>

      {view === 'amount' && <div className="table-scroll"><table className="data-table budget-detail-table">
        <thead><tr><th>纳入</th><th>一级分类</th><th>二级分类</th><th>预算项目</th><th>单位</th><th>数量</th><th>预算单价</th><th>计划预算</th><th>实际支出</th><th>待付款</th><th>偏差</th><th>状态</th><th>来源</th><th /></tr></thead>
        <tbody>{visibleItems.map(row => <tr key={row.id}>
          <td className="budget-cell--manual"><input type="checkbox" disabled={!writable || Boolean(row.inclusionParameterKey)} checked={row.includedResolved} onChange={event => patchItem(row.id, { included: event.target.checked })} /></td>
          <td>{categories.find(item => item.id === row.categoryId)?.name ?? row.category}</td>
          <td><select className="budget-input--manual" disabled={!writable} value={row.secondaryCategoryId ?? ''} onChange={event => {
            const secondary = categories.find(item => item.id === event.target.value);
            const primary = categories.find(item => item.id === secondary?.parentId);
            patchItem(row.id, { secondaryCategoryId: secondary?.id ?? '', categoryId: primary?.id ?? '', category: primary?.name ?? row.category });
          }}>{categories.filter(item => item.level === 2 && (!selected || selected.level === 2 || item.parentId === row.categoryId)).map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></td>
          <td className="budget-cell--manual"><input disabled={!writable} value={row.name} onChange={event => patchItem(row.id, { name: event.target.value })} /></td>
          <td className="budget-cell--manual"><input disabled={!writable} value={row.unit} onChange={event => patchItem(row.id, { unit: event.target.value })} /></td>
          <td className={row.quantitySource === 'manual' ? 'budget-cell--manual' : 'budget-cell--auto'}>{row.quantitySource === 'manual' ? <input type="number" min="0" disabled={!writable} value={row.quantity} onChange={event => patchItem(row.id, { quantity: Number(event.target.value) })} /> : <strong title={row.formulaDescription}>{row.resolvedQuantity}</strong>}</td>
          <td className={row.unitPriceSource === 'manual' ? 'budget-cell--manual' : 'budget-cell--auto'}>{row.unitPriceSource === 'manual' ? <input type="number" min="0" disabled={!writable} value={row.unitPrice} onChange={event => patchItem(row.id, { unitPrice: Number(event.target.value) })} /> : <strong>{currency.format(row.resolvedUnitPrice)}</strong>}</td>
          <td className="budget-cell--auto" title={row.formulaDescription}><strong>{currency.format(row.budgetAmount)}</strong></td>
          <td className="budget-cell--auto" title="由财务流水自动汇总">{currency.format(row.actualAmount)}</td>
          <td className="budget-cell--auto">{currency.format(row.outstandingAmount)}</td>
          <td className={row.varianceAmount > 0 ? 'variance-positive' : 'variance-negative'}>{currency.format(row.varianceAmount)}</td>
          <td><select disabled={!writable} value={row.status} onChange={event => patchItem(row.id, { status: event.target.value as BudgetStatus })}>{Object.entries(statusLabels).map(([value,label]) => <option key={value} value={value}>{label}</option>)}</select></td>
          <td><div className="budget-source-stack">{row.sourceLabels.map(label => <BudgetSourceBadge key={label} label={label} title={row.formulaDescription} />)}</div></td>
          <td><div className="budget-row-actions">
            <button className="icon-button" title="在下方插入" disabled={!writable} onClick={() => insertItem(row)}><Icon name="plus" /></button>
            <button className="icon-button" title="复制" disabled={!writable} onClick={() => duplicateItem(row)}><Icon name="copy" /></button>
            <button className="icon-button" title="上移" disabled={!writable} onClick={() => moveItem(row,-1)}>↑</button>
            <button className="icon-button" title="下移" disabled={!writable} onClick={() => moveItem(row,1)}>↓</button>
            <button className="icon-button icon-button--danger" title={deleteWritable ? '删除' : '删除需要预算与执行写权限'} disabled={!deleteWritable} onClick={() => removeItem(row.id)}><Icon name="trash" /></button>
          </div></td>
        </tr>)}</tbody>
      </table></div>}

      {view === 'contract' && <div className="table-scroll"><table className="data-table budget-detail-table">
        <thead><tr><th>预算项目</th><th>供应商</th><th>选中报价</th><th>合同</th><th>合同金额</th><th>计划预算</th><th>已付款</th><th>待付款</th><th>合同状态</th><th>附件</th></tr></thead>
        <tbody>{visibleItems.map(row => {
          const vendor = data.vendors.find(item => item.id === row.vendorId);
          const quote = data.quotes.find(item => item.id === row.quoteId) ?? data.quotes.find(item => item.budgetItemId === row.id && item.selected);
          const contract = data.contracts.find(item => item.id === row.contractId) ?? data.contracts.find(item => item.budgetItemIds.includes(row.id));
          return <tr key={row.id}><td><strong>{row.name}</strong><small>{row.paymentTerms || '未设置付款条款'}</small></td><td>{vendor?.name || '未关联'}</td><td>{quote ? currency.format(quote.amount) : '未选报价'}</td><td>{contract?.title || '未关联合同'}</td><td className="budget-cell--auto">{currency.format(contract?.amount ?? 0)}</td><td className="budget-cell--auto">{currency.format(row.budgetAmount)}</td><td className="budget-cell--auto">{currency.format(row.paidAmount)}</td><td className="budget-cell--auto">{currency.format(row.outstandingAmount)}</td><td>{contract?.status || '未签约'}</td><td>{contract?.attachmentIds.length ?? 0} 份</td></tr>;
        })}</tbody>
      </table></div>}

      {view === 'execution' && <div className="table-scroll"><table className="data-table budget-detail-table">
        <thead><tr><th>预算项目</th><th>最晚确认节点</th><th>负责人</th><th>协同人</th><th>验收标准</th><th>风险提示</th><th>当前阶段</th></tr></thead>
        <tbody>{visibleItems.map(row => <tr key={row.id}><td><strong>{row.name}</strong></td>
          <td className="budget-cell--manual"><input disabled={!writable} value={row.latestConfirm ?? ''} onChange={event => patchItem(row.id, { latestConfirm: event.target.value })} /></td>
          <td className="budget-cell--manual"><select disabled={!writable} value={row.ownerMemberId ?? ''} onChange={event => patchItem(row.id, { ownerMemberId: event.target.value })}><option value="">未设置</option>{data.members.filter(item => item.active).map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></td>
          <td className="budget-cell--manual"><select multiple disabled={!writable} value={row.collaboratorMemberIds ?? []} onChange={event => patchItem(row.id, { collaboratorMemberIds: Array.from(event.currentTarget.selectedOptions, option => option.value) })}>{data.members.filter(item => item.active).map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></td>
          <td className="budget-cell--manual"><textarea disabled={!writable} value={row.acceptanceCriteria ?? ''} onChange={event => patchItem(row.id, { acceptanceCriteria: event.target.value })} /></td>
          <td className="budget-cell--manual"><textarea disabled={!writable} value={row.riskTip ?? ''} onChange={event => patchItem(row.id, { riskTip: event.target.value })} /></td>
          <td><span className={`status status--${row.status === 'paid' ? 'success' : row.status === 'confirmed' ? 'warning' : 'neutral'}`}>{statusLabels[row.status]}</span></td>
        </tr>)}</tbody>
      </table></div>}
    </section>
  </div>;
}
