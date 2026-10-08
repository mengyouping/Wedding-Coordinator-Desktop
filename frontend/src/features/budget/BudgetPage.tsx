import { useState } from 'react';
import { Icon } from '../../components/Icon';
import { LoadingState } from '../../components/LoadingState';
import { PageHeader } from '../../components/PageHeader';
import { useWeddingData } from '../../state/WeddingDataProvider';
import { BudgetWorkbookNav, type BudgetWorkbookTab } from './components/BudgetWorkbookNav';
import { resolveBudgetWorkbook } from './engine/budgetRuleEngine';
import { BudgetChecklistTab } from './tabs/BudgetChecklistTab';
import { BudgetDetailTab } from './tabs/BudgetDetailTab';
import { BudgetOverviewTab } from './tabs/BudgetOverviewTab';
import { BudgetParametersTab } from './tabs/BudgetParametersTab';
import { BudgetPaymentsTab } from './tabs/BudgetPaymentsTab';

function csvCell(value: unknown): string {
  return `"${String(value ?? '').replaceAll('"', '""')}"`;
}

export function BudgetPage() {
  const { data, loading } = useWeddingData();
  const [tab, setTab] = useState<BudgetWorkbookTab>('overview');
  const [categoryId, setCategoryId] = useState('');
  if (loading || !data) return <LoadingState />;
  const workbook = resolveBudgetWorkbook(data);

  const openCategory = (id: string) => {
    setCategoryId(id);
    setTab('detail');
  };

  const exportCsv = () => {
    const header = ['一级分类', '二级分类', '预算项目', '是否纳入', '单位', '解析数量', '解析单价', '计划预算', '实际支出', '已付款', '待付款', '差异', '供应商', '合同', '最晚确认节点', '负责人', '协同人', '验收标准', '风险提示', '公式来源'];
    const lines = workbook.items.map(item => {
      const primary = workbook.categories.find(category => category.id === item.categoryId)?.name ?? item.category;
      const secondary = workbook.categories.find(category => category.id === item.secondaryCategoryId)?.name ?? '';
      const vendor = data.vendors.find(value => value.id === item.vendorId)?.name ?? '';
      const contract = data.contracts.find(value => value.id === item.contractId)?.title ?? '';
      const owner = data.members.find(value => value.id === item.ownerMemberId)?.name ?? '';
      const collaborators = (item.collaboratorMemberIds ?? []).map(id => data.members.find(value => value.id === id)?.name ?? id).join('、');
      return [primary, secondary, item.name, item.includedResolved ? '是' : '否', item.unit, item.resolvedQuantity, item.resolvedUnitPrice, item.budgetAmount, item.actualAmount, item.paidAmount, item.outstandingAmount, item.varianceAmount, vendor, contract, item.latestConfirm, owner, collaborators, item.acceptanceCriteria, item.riskTip, item.formulaDescription].map(csvCell).join(',');
    });
    const content = '\ufeff' + [header.map(csvCell).join(','), ...lines].join('\n');
    const url = URL.createObjectURL(new Blob([content], { type: 'text/csv;charset=utf-8' }));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `婚礼预算工作簿-${data.settings.projectName}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return <div className="page budget-workbook-page">
    <PageHeader
      eyebrow="BUDGET WORKBOOK V5"
      title="预算工作簿"
      description="以Excel预算模型为基础，统一一级分类、二级分类、三级项目、参数公式、付款节点和总指挥清单。黄色字段允许输入，绿色字段自动计算。"
      actions={<button className="button button--ghost" onClick={exportCsv}><Icon name="download" />导出三级预算 CSV</button>}
    />

    <BudgetWorkbookNav active={tab} onChange={setTab} />

    <div className="budget-workbook-color-guide" role="note">
      <span><i className="legend-dot legend-dot--manual" /><strong>黄色字段</strong> 可以手工输入或调整</span>
      <span><i className="legend-dot legend-dot--auto" /><strong>绿色字段</strong> 来自参数、宾客、报价、合同、公式或财务流水</span>
      <span><Icon name="database" />实际支出只读取 FinancialTransaction</span>
    </div>

    {tab === 'overview' && <BudgetOverviewTab workbook={workbook} onOpenCategory={openCategory} />}
    {tab === 'detail' && <BudgetDetailTab workbook={workbook} selectedCategoryId={categoryId} onSelectCategory={setCategoryId} />}
    {tab === 'parameters' && <BudgetParametersTab workbook={workbook} />}
    {tab === 'payments' && <BudgetPaymentsTab workbook={workbook} />}
    {tab === 'checklist' && <BudgetChecklistTab workbook={workbook} />}
  </div>;
}
