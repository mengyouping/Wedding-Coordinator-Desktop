import { Icon } from '../../../components/Icon';
import { EditableOperationsTable, type OperationsColumn } from '../components/EditableOperationsTable';
import { OperationsSummary } from '../components/OperationsSummary';
import { operationsStatuses } from '../components/StatusSelect';
import type { VendorDelivery } from '../model';
import { operationId } from '../model';

const columns: Array<OperationsColumn<VendorDelivery>> = [
  { key: 'vendor', label: '供应商', width: 150 },
  { key: 'category', label: '类别', width: 100 },
  { key: 'deliverable', label: '交付物/服务范围', type: 'textarea', width: 300 },
  { key: 'arrivalAt', label: '到场时间', width: 130 },
  { key: 'entryGate', label: '进场口', width: 120 },
  { key: 'vehicle', label: '车辆', width: 140 },
  { key: 'staffCount', label: '人数', type: 'number', width: 80 },
  { key: 'powerNeed', label: '用电需求', width: 140 },
  { key: 'acceptance', label: '验收标准', type: 'textarea', width: 300 },
  { key: 'owner', label: '我方负责人', width: 120 },
  { key: 'exitAt', label: '退场时间', width: 130 },
  { key: 'status', label: '状态', type: 'select', options: operationsStatuses, width: 110 }
];

export function VendorDeliveryCenter({ rows, onChange }: { rows: VendorDelivery[]; onChange(rows: VendorDelivery[]): void }) {
  const missingAcceptance = rows.filter(item => !item.acceptance.trim()).length;
  const missingExit = rows.filter(item => !item.exitAt.trim()).length;
  const totalStaff = rows.reduce((sum, item) => sum + item.staffCount, 0);
  const risky = rows.filter(item => item.status === '有风险' || !item.owner.trim()).length;
  const arrivalGroups = rows.reduce<Record<string, number>>((result, item) => {
    const key = item.arrivalAt || '未设置';
    result[key] = (result[key] ?? 0) + 1;
    return result;
  }, {});
  const crowded = Object.entries(arrivalGroups).filter(([, count]) => count >= 3);
  const patch = (id: string, value: Partial<VendorDelivery>) => onChange(rows.map(item => item.id === id ? { ...item, ...value } : item));

  return <div className="operations-center">
    <OperationsSummary metrics={[
      { label: '供应商交付', value: rows.length, detail: `预计现场人员 ${totalStaff} 人`, icon: <Icon name="vendors" /> },
      { label: '进场高峰', value: crowded.length, detail: crowded.length ? crowded.map(([time, count]) => `${time}（${count}家）`).join('、') : '未发现三家以上同时间到场', tone: crowded.length ? 'warning' : 'success', icon: <Icon name="timeline" /> },
      { label: '验收缺口', value: missingAcceptance, detail: '未填写交付验收标准', tone: missingAcceptance ? 'danger' : 'success', icon: <Icon name="tasks" /> },
      { label: '退场/人员风险', value: missingExit + risky, detail: `退场遗漏 ${missingExit} · 人员风险 ${risky}`, tone: missingExit + risky ? 'warning' : 'success', icon: <Icon name="warning" /> }
    ]} />

    <section className="panel operations-section"><header><div><span className="eyebrow">VENDOR DELIVERY</span><h2>供应商进场、交付、验收与退场</h2><p>合同只是法律与金额依据，现场还需要独立维护车辆、人员、进场口、用电、验收和退场恢复。</p></div></header><EditableOperationsTable
      rows={rows}
      columns={columns}
      onPatch={patch}
      onAdd={() => onChange([...rows, { id: operationId('delivery'), vendor: '新增供应商', category: '其他', deliverable: '', arrivalAt: '', entryGate: '', vehicle: '', staffCount: 0, powerNeed: '无', acceptance: '', owner: '', exitAt: '', status: '待确认' }])}
      onDuplicate={row => onChange([...rows, { ...structuredClone(row), id: operationId('delivery'), vendor: `${row.vendor}副本` }])}
      onRemove={id => window.confirm('确认删除该供应商交付计划吗？') && onChange(rows.filter(item => item.id !== id))}
    /></section>

    <section className="panel operations-section"><header><div><span className="eyebrow">ENTRY SCHEDULE</span><h2>供应商进退场波次</h2></div></header><div className="operations-wave-board">{Object.entries(arrivalGroups).sort(([a], [b]) => a.localeCompare(b)).map(([time, count]) => <article key={time} className={count >= 3 ? 'is-crowded' : ''}><time>{time}</time><strong>{count} 家供应商</strong><span>{rows.filter(item => (item.arrivalAt || '未设置') === time).map(item => item.vendor).join('、')}</span><small>{rows.filter(item => (item.arrivalAt || '未设置') === time).map(item => item.entryGate || '未设置进场口').join(' / ')}</small></article>)}</div></section>
  </div>;
}
