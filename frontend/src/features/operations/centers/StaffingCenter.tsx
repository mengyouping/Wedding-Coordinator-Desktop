import { Icon } from '../../../components/Icon';
import { EditableOperationsTable, type OperationsColumn } from '../components/EditableOperationsTable';
import { OperationsSummary } from '../components/OperationsSummary';
import { operationsStatuses } from '../components/StatusSelect';
import type { StaffPosition } from '../model';
import { operationId } from '../model';

const columns: Array<OperationsColumn<StaffPosition>> = [
  { key: 'team', label: '组别', width: 100 },
  { key: 'position', label: '岗位', width: 140 },
  { key: 'scope', label: '工作范围', type: 'textarea', width: 300 },
  { key: 'owner', label: '主负责人', width: 120 },
  { key: 'backup', label: '备份人', width: 120 },
  { key: 'contact', label: '联系电话', width: 130 },
  { key: 'shiftStart', label: '开始', type: 'time', width: 95 },
  { key: 'shiftEnd', label: '结束', type: 'time', width: 95 },
  { key: 'meetingPoint', label: '集合点', width: 150 },
  { key: 'reportTo', label: '汇报对象', width: 110 },
  { key: 'checklist', label: '岗位检查清单', type: 'textarea', width: 260 },
  { key: 'status', label: '状态', type: 'select', options: operationsStatuses, width: 110 }
];

export function StaffingCenter({ rows, onChange }: { rows: StaffPosition[]; onChange(rows: StaffPosition[]): void }) {
  const missingOwner = rows.filter(item => !item.owner.trim()).length;
  const missingBackup = rows.filter(item => !item.backup.trim()).length;
  const atRisk = rows.filter(item => item.status === '有风险').length;
  const teams = [...new Set(rows.map(item => item.team))];
  const patch = (id: string, value: Partial<StaffPosition>) => onChange(rows.map(item => item.id === id ? { ...item, ...value } : item));

  return <div className="operations-center">
    <OperationsSummary metrics={[
      { label: '岗位总数', value: rows.length, detail: `${teams.length} 个执行组`, icon: <Icon name="tasks" /> },
      { label: '未设置负责人', value: missingOwner, detail: '必须在婚礼日前关闭', tone: missingOwner ? 'danger' : 'success', icon: <Icon name="guests" /> },
      { label: '未设置备份', value: missingBackup, detail: '关键岗位必须有替补', tone: missingBackup ? 'warning' : 'success', icon: <Icon name="warning" /> },
      { label: '有风险岗位', value: atRisk, detail: '需总指挥确认资源', tone: atRisk ? 'danger' : 'success', icon: <Icon name="risk" /> }
    ]} />

    <section className="panel operations-section"><header><div><span className="eyebrow">ROLE & RESPONSIBILITY</span><h2>人员岗位、工作范围与班次</h2><p>每个岗位都必须明确主负责人、备份人、联系电话、集合点、汇报对象和检查清单。</p></div></header><EditableOperationsTable
      rows={rows}
      columns={columns}
      onPatch={patch}
      onAdd={() => onChange([...rows, { id: operationId('staff'), team: '新增组别', position: '新增岗位', scope: '', owner: '', backup: '', contact: '', shiftStart: '08:00', shiftEnd: '22:00', meetingPoint: '', reportTo: '总指挥', checklist: '', status: '待确认' }])}
      onDuplicate={row => onChange([...rows, { ...structuredClone(row), id: operationId('staff'), position: `${row.position}副本`, owner: '', backup: '' }])}
      onRemove={id => window.confirm('确认删除该岗位吗？') && onChange(rows.filter(item => item.id !== id))}
    /></section>

    <section className="panel operations-section"><header><div><span className="eyebrow">RACI MATRIX</span><h2>组别责任矩阵</h2><p>快速查看每个执行组覆盖的岗位、责任人和风险状态。</p></div></header><div className="operations-raci-grid">{teams.map(team => {
      const members = rows.filter(item => item.team === team);
      return <article key={team}><header><strong>{team}</strong><span>{members.length} 岗</span></header>{members.map(item => <div key={item.id}><span><b>{item.position}</b><small>{item.scope}</small></span><em>{item.owner || '未指定'}</em><i className={`operations-dot is-${item.status}`}>{item.status}</i></div>)}</article>;
    })}</div></section>
  </div>;
}
