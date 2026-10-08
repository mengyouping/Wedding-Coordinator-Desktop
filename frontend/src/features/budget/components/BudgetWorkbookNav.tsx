import { Icon, type IconName } from '../../../components/Icon';

export type BudgetWorkbookTab = 'overview' | 'detail' | 'parameters' | 'payments' | 'checklist';

const tabs: Array<{ id: BudgetWorkbookTab; label: string; description: string; icon: IconName }> = [
  { id: 'overview', label: '总控看板', description: '预算红线与分类占比', icon: 'dashboard' },
  { id: 'detail', label: '分类明细', description: '一级、二级、三级预算', icon: 'budget' },
  { id: 'parameters', label: '参数模型', description: '黄色输入、绿色联动', icon: 'settings' },
  { id: 'payments', label: '付款与合同', description: '计划节点与真实流水', icon: 'finance' },
  { id: 'checklist', label: '总指挥清单', description: '负责人、协同与验收', icon: 'tasks' }
];

export function BudgetWorkbookNav({ active, onChange }: { active: BudgetWorkbookTab; onChange: (tab: BudgetWorkbookTab) => void }) {
  return <nav className="budget-workbook-nav panel" aria-label="预算工作簿页签">
    {tabs.map(tab => <button key={tab.id} className={active === tab.id ? 'is-active' : ''} onClick={() => onChange(tab.id)} aria-current={active === tab.id ? 'page' : undefined}>
      <span className="budget-workbook-nav__icon"><Icon name={tab.icon} /></span>
      <span><strong>{tab.label}</strong><small>{tab.description}</small></span>
    </button>)}
  </nav>;
}
