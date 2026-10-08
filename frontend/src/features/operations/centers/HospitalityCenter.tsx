import { Icon } from '../../../components/Icon';
import { EditableOperationsTable, type OperationsColumn } from '../components/EditableOperationsTable';
import { OperationsSummary } from '../components/OperationsSummary';
import { operationsStatuses } from '../components/StatusSelect';
import type { HospitalityService } from '../model';
import { operationId } from '../model';

const columns: Array<OperationsColumn<HospitalityService>> = [
  { key: 'serviceType', label: '服务类型', width: 120 },
  { key: 'guestGroup', label: '服务对象', width: 160 },
  { key: 'headcount', label: '人数', type: 'number', width: 80 },
  { key: 'arrivalAt', label: '到达/开始', width: 130 },
  { key: 'departureAt', label: '离开/结束', width: 130 },
  { key: 'vehicle', label: '车辆/班次', width: 160 },
  { key: 'driver', label: '司机/联系人', width: 130 },
  { key: 'hotel', label: '酒店/目的地', width: 160 },
  { key: 'roomCount', label: '房间', type: 'number', width: 80 },
  { key: 'giftCount', label: '礼品', type: 'number', width: 80 },
  { key: 'owner', label: '负责人', width: 120 },
  { key: 'note', label: '执行说明', type: 'textarea', width: 280 },
  { key: 'status', label: '状态', type: 'select', options: operationsStatuses, width: 110 }
];

export function HospitalityCenter({ rows, onChange }: { rows: HospitalityService[]; onChange(rows: HospitalityService[]): void }) {
  const served = rows.reduce((sum, item) => sum + item.headcount, 0);
  const rooms = rows.reduce((sum, item) => sum + item.roomCount, 0);
  const gifts = rows.reduce((sum, item) => sum + item.giftCount, 0);
  const atRisk = rows.filter(item => item.status === '有风险' || !item.owner.trim()).length;
  const patch = (id: string, value: Partial<HospitalityService>) => onChange(rows.map(item => item.id === id ? { ...item, ...value } : item));

  return <div className="operations-center">
    <OperationsSummary metrics={[
      { label: '接待服务', value: rows.length, detail: '覆盖接驳、住宿、签到、礼品和特殊宾客', icon: <Icon name="guests" /> },
      { label: '服务人次', value: served, detail: '不同服务可能重复覆盖同一宾客', icon: <Icon name="projects" /> },
      { label: '计划房间', value: rooms, detail: `计划礼品 ${gifts} 份`, icon: <Icon name="attachments" /> },
      { label: '接待风险', value: atRisk, detail: '含有风险或未指定负责人', tone: atRisk ? 'warning' : 'success', icon: <Icon name="warning" /> }
    ]} />

    <section className="panel operations-section"><header><div><span className="eyebrow">GUEST HOSPITALITY</span><h2>接驳、住宿、签到、礼金与伴手礼</h2><p>按服务场景而不是只按宾客姓名管理，便于统计车辆、房间、礼品和责任人缺口。</p></div></header><EditableOperationsTable
      rows={rows}
      columns={columns}
      onPatch={patch}
      onAdd={() => onChange([...rows, { id: operationId('host'), serviceType: '新增服务', guestGroup: '待定义宾客组', headcount: 0, arrivalAt: '', departureAt: '', vehicle: '', driver: '', hotel: '', roomCount: 0, giftCount: 0, owner: '', status: '待确认', note: '' }])}
      onDuplicate={row => onChange([...rows, { ...structuredClone(row), id: operationId('host'), serviceType: `${row.serviceType}副本` }])}
      onRemove={id => window.confirm('确认删除该接待服务吗？') && onChange(rows.filter(item => item.id !== id))}
    /></section>

    <section className="panel operations-section operations-hospitality-board"><header><div><span className="eyebrow">SERVICE BOARD</span><h2>按服务类型汇总</h2></div></header><div>{[...new Set(rows.map(item => item.serviceType))].map(type => {
      const group = rows.filter(item => item.serviceType === type);
      return <article key={type}><strong>{type}</strong><span>{group.reduce((sum, item) => sum + item.headcount, 0)} 人次</span><small>{group.map(item => item.guestGroup).join('、')}</small><em>{group.some(item => item.status === '有风险') ? '有风险' : group.every(item => ['已确认', '已完成'].includes(item.status)) ? '已确认' : '推进中'}</em></article>;
    })}</div></section>
  </div>;
}
