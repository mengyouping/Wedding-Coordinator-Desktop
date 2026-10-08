import { Icon } from '../../../components/Icon';
import { EditableOperationsTable, type OperationsColumn } from '../components/EditableOperationsTable';
import { OperationsSummary } from '../components/OperationsSummary';
import { StatusSelect, operationsStatuses } from '../components/StatusSelect';
import type { EmergencyPlan, OperationsStatus, WeddingOperationsDraft } from '../model';
import { atRiskCount, completedRate, operationId } from '../model';

const emergencyColumns: Array<OperationsColumn<EmergencyPlan>> = [
  { key: 'scenario', label: '场景', width: 150 },
  { key: 'trigger', label: '触发条件', type: 'textarea', width: 250 },
  { key: 'level', label: '等级', type: 'select', options: ['低', '中', '高'], width: 80 },
  { key: 'commander', label: '指挥人', width: 120 },
  { key: 'contacts', label: '关键联系人', type: 'textarea', width: 240 },
  { key: 'responseSteps', label: '处理步骤', type: 'textarea', width: 320 },
  { key: 'backupResource', label: '备用资源', type: 'textarea', width: 240 },
  { key: 'linkedArea', label: '影响区域', width: 160 },
  { key: 'status', label: '状态', type: 'select', options: operationsStatuses, width: 110 }
];

export function CommandCenter({ draft, onChange, coordinatorName, coordinatorPhone }: {
  draft: WeddingOperationsDraft;
  onChange(next: WeddingOperationsDraft): void;
  coordinatorName: string;
  coordinatorPhone: string;
}) {
  const allRows = [
    ...draft.menus, ...draft.beverages, ...draft.deployments, ...draft.staffPositions,
    ...draft.hospitalityServices, ...draft.ceremonyPrograms, ...draft.vendorDeliveries,
    ...draft.logisticsRecords, ...draft.emergencyPlans
  ];
  const unreadyStaff = draft.staffPositions.filter(item => !['已确认', '已完成'].includes(item.status) || !item.owner.trim());
  const unreadyVendors = draft.vendorDeliveries.filter(item => !['已确认', '已完成'].includes(item.status));
  const unreadyLogistics = draft.logisticsRecords.filter(item => !['已确认', '已完成'].includes(item.status));
  const beverageGap = draft.beverages.reduce((sum, item) => sum + Math.max(0, item.plannedQty - item.stockQty), 0);
  const highRisks = draft.emergencyPlans.filter(item => item.level === '高' && !['已确认', '已完成'].includes(item.status));
  const stamp = (): Pick<WeddingOperationsDraft, 'updatedAt'> => ({ updatedAt: new Date().toISOString() });

  const updateEmergencies = (rows: EmergencyPlan[]) => onChange({ ...draft, emergencyPlans: rows, ...stamp() });
  const patchEmergency = (id: string, value: Partial<EmergencyPlan>) => updateEmergencies(draft.emergencyPlans.map(item => item.id === id ? { ...item, ...value } : item));
  const updateStaffStatus = (id: string, status: OperationsStatus) => onChange({ ...draft, staffPositions: draft.staffPositions.map(item => item.id === id ? { ...item, status } : item), ...stamp() });
  const updateVendorStatus = (id: string, status: OperationsStatus) => onChange({ ...draft, vendorDeliveries: draft.vendorDeliveries.map(item => item.id === id ? { ...item, status } : item), ...stamp() });
  const updateLogisticsStatus = (id: string, status: OperationsStatus) => onChange({ ...draft, logisticsRecords: draft.logisticsRecords.map(item => item.id === id ? { ...item, status } : item), ...stamp() });

  return <div className="operations-center">
    <OperationsSummary metrics={[
      { label: '全案完成率', value: `${completedRate(allRows)}%`, detail: `${allRows.length} 条全案记录`, tone: completedRate(allRows) >= 80 ? 'success' : 'normal', icon: <Icon name="dashboard" /> },
      { label: '有风险记录', value: atRiskCount(allRows), detail: `高等级预案待确认 ${highRisks.length}`, tone: atRiskCount(allRows) ? 'danger' : 'success', icon: <Icon name="risk" /> },
      { label: '现场未到位', value: unreadyStaff.length + unreadyVendors.length + unreadyLogistics.length, detail: `岗位 ${unreadyStaff.length} · 供应商 ${unreadyVendors.length} · 物流 ${unreadyLogistics.length}`, tone: 'warning', icon: <Icon name="warroom" /> },
      { label: '酒水缺口', value: beverageGap, detail: '计划数量减已入库数量', tone: beverageGap ? 'danger' : 'success', icon: <Icon name="materials" /> }
    ]} />

    <section className="operations-command-grid">
      <article className="panel operations-section command-readiness"><header><div><span className="eyebrow">STAFF READINESS</span><h2>岗位到位状态</h2></div><strong>{unreadyStaff.length}</strong></header><div>{draft.staffPositions.map(item => <div key={item.id}><span><b>{item.position}</b><small>{item.owner || '未指定负责人'} · {item.meetingPoint || '未设置集合点'}</small></span><StatusSelect compact value={item.status} onChange={value => updateStaffStatus(item.id, value)} /></div>)}</div></article>
      <article className="panel operations-section command-readiness"><header><div><span className="eyebrow">VENDOR READINESS</span><h2>供应商到场与验收</h2></div><strong>{unreadyVendors.length}</strong></header><div>{draft.vendorDeliveries.map(item => <div key={item.id}><span><b>{item.vendor}</b><small>{item.arrivalAt || '未设置到场时间'} · {item.entryGate || '未设置进场口'}</small></span><StatusSelect compact value={item.status} onChange={value => updateVendorStatus(item.id, value)} /></div>)}</div></article>
      <article className="panel operations-section command-readiness"><header><div><span className="eyebrow">LOGISTICS READINESS</span><h2>关键物料到位</h2></div><strong>{unreadyLogistics.length}</strong></header><div>{draft.logisticsRecords.map(item => <div key={item.id}><span><b>{item.name}</b><small>{item.boxCode || '无箱码'} · {item.handoverTo || '未交接'}</small></span><StatusSelect compact value={item.status} onChange={value => updateLogisticsStatus(item.id, value)} /></div>)}</div></article>
    </section>

    <section className="panel operations-section"><header><div><span className="eyebrow">EMERGENCY PLAYBOOK</span><h2>现场应急预案库</h2><p>将天气、停电、设备、人员、交通、宾客、食品安全和物料遗失转化为可直接执行的预案。</p></div></header><EditableOperationsTable
      rows={draft.emergencyPlans}
      columns={emergencyColumns}
      onPatch={patchEmergency}
      onAdd={() => updateEmergencies([...draft.emergencyPlans, { id: operationId('emergency'), scenario: '新增应急场景', trigger: '', level: '中', commander: coordinatorName || '总指挥', contacts: '', responseSteps: '', backupResource: '', linkedArea: '全场', status: '待确认' }])}
      onDuplicate={row => updateEmergencies([...draft.emergencyPlans, { ...structuredClone(row), id: operationId('emergency'), scenario: `${row.scenario}副本` }])}
      onRemove={id => window.confirm('确认删除该应急预案吗？') && updateEmergencies(draft.emergencyPlans.filter(item => item.id !== id))}
    /></section>

    <section className="panel operations-section operations-contact-board"><header><div><span className="eyebrow">COMMUNICATION CARD</span><h2>现场关键通讯卡</h2></div></header><div>
      <article><Icon name="warroom" /><span><strong>总指挥</strong><b>{coordinatorName || '待设置'}</b><small>{coordinatorPhone || '未设置电话'}</small></span></article>
      {draft.staffPositions.filter(item => item.contact || ['总指挥', '酒店接口人', '婚庆接口人', '车辆组长', '应急负责人'].includes(item.position)).slice(0, 8).map(item => <article key={item.id}><Icon name="guests" /><span><strong>{item.position}</strong><b>{item.owner || '待指定'}</b><small>{item.contact || '未设置电话'}</small></span></article>)}
    </div></section>
  </div>;
}
