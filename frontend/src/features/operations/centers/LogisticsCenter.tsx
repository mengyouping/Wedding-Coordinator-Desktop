import { Icon } from '../../../components/Icon';
import { EditableOperationsTable, type OperationsColumn } from '../components/EditableOperationsTable';
import { OperationsSummary } from '../components/OperationsSummary';
import { operationsStatuses } from '../components/StatusSelect';
import type { LogisticsRecord } from '../model';
import { operationId } from '../model';

const columns: Array<OperationsColumn<LogisticsRecord>> = [
  { key: 'name', label: '物料/箱包', width: 180 },
  { key: 'category', label: '分类', width: 110 },
  { key: 'quantity', label: '数量', type: 'number', width: 80 },
  { key: 'unit', label: '单位', width: 70 },
  { key: 'boxCode', label: '装箱码', width: 130 },
  { key: 'vehicle', label: '车辆', width: 140 },
  { key: 'loadOrder', label: '装车顺序', type: 'number', width: 100 },
  { key: 'storage', label: '现场存放', width: 180 },
  { key: 'handoverTo', label: '交接人', width: 130 },
  { key: 'returnRequired', label: '需要回收', type: 'boolean', width: 100 },
  { key: 'returnedQty', label: '已回收', type: 'number', width: 90 },
  { key: 'status', label: '状态', type: 'select', options: operationsStatuses, width: 110 }
];

export function LogisticsCenter({ rows, onChange }: { rows: LogisticsRecord[]; onChange(rows: LogisticsRecord[]): void }) {
  const returnRequired = rows.filter(item => item.returnRequired);
  const returnGap = returnRequired.reduce((sum, item) => sum + Math.max(0, item.quantity - item.returnedQty), 0);
  const missingBox = rows.filter(item => !item.boxCode.trim()).length;
  const missingHandover = rows.filter(item => !item.handoverTo.trim()).length;
  const vehicles = [...new Set(rows.map(item => item.vehicle).filter(Boolean))];
  const patch = (id: string, value: Partial<LogisticsRecord>) => onChange(rows.map(item => item.id === id ? { ...item, ...value } : item));

  return <div className="operations-center">
    <OperationsSummary metrics={[
      { label: '物流记录', value: rows.length, detail: `${vehicles.length} 辆/类运输工具`, icon: <Icon name="materials" /> },
      { label: '待回收差异', value: returnGap, detail: `${returnRequired.length} 项需要回收`, tone: returnGap ? 'warning' : 'success', icon: <Icon name="conflicts" /> },
      { label: '缺少装箱码', value: missingBox, detail: '无法快速定位箱包', tone: missingBox ? 'danger' : 'success', icon: <Icon name="attachments" /> },
      { label: '交接缺口', value: missingHandover, detail: '必须明确最终领取人', tone: missingHandover ? 'warning' : 'success', icon: <Icon name="warning" /> }
    ]} />

    <section className="panel operations-section"><header><div><span className="eyebrow">LOGISTICS REGISTER</span><h2>装箱、装车、运输、交接和回收</h2><p>每件关键物料都应有箱码、车辆、装车顺序、现场存放、交接人和回收要求。</p></div></header><EditableOperationsTable
      rows={rows.slice().sort((a, b) => a.vehicle.localeCompare(b.vehicle) || a.loadOrder - b.loadOrder)}
      columns={columns}
      onPatch={patch}
      onAdd={() => onChange([...rows, { id: operationId('logistics'), name: '新增物料', category: '其他', quantity: 1, unit: '件', boxCode: '', vehicle: '', loadOrder: rows.length + 1, storage: '', handoverTo: '', returnRequired: false, returnedQty: 0, status: '待确认' }])}
      onDuplicate={row => onChange([...rows, { ...structuredClone(row), id: operationId('logistics'), name: `${row.name}副本`, boxCode: `${row.boxCode}-COPY` }])}
      onRemove={id => window.confirm('确认删除该物流记录吗？') && onChange(rows.filter(item => item.id !== id))}
    /></section>

    <section className="panel operations-section"><header><div><span className="eyebrow">VEHICLE LOAD PLAN</span><h2>车辆装载与卸货清单</h2></div></header><div className="operations-vehicle-grid">{vehicles.map(vehicle => {
      const items = rows.filter(item => item.vehicle === vehicle).sort((a, b) => a.loadOrder - b.loadOrder);
      return <article key={vehicle}><header><strong>{vehicle}</strong><span>{items.reduce((sum, item) => sum + item.quantity, 0)} 件/份</span></header>{items.map(item => <div key={item.id}><i>{item.loadOrder}</i><span><b>{item.name}</b><small>{item.boxCode || '无箱码'} · {item.storage || '未设置存放点'}</small></span><em>{item.handoverTo || '未交接'}</em></div>)}</article>;
    })}</div></section>
  </div>;
}
