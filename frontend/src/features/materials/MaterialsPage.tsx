import { useState } from 'react';
import { Icon } from '../../components/Icon';
import { LoadingState } from '../../components/LoadingState';
import { Modal } from '../../components/Modal';
import { PageHeader } from '../../components/PageHeader';
import { createId } from '../../lib/id';
import { useWeddingData } from '../../state/WeddingDataProvider';
import type { MaterialItem, MaterialStatus, TransportStatus } from '../../types/domain';

const transportStatuses: TransportStatus[] = ['未装箱', '已装箱', '运输中', '已到场', '已回收'];
const blank = (): MaterialItem => ({
  id: createId('material'), name: '', category: '其他', quantity: 1, unit: '件', owner: '总指挥',
  status: '待采购', supplier: '', expectedDate: '', checkedQuantity: 0, boxCode: '', note: '',
  storageLocation: '', handoverTo: '', transportStatus: '未装箱', returnRequired: false, returnedQuantity: 0
});

export function MaterialsPage() {
  const { data, loading, updateCollection, can } = useWeddingData();
  const [editing, setEditing] = useState<MaterialItem | null>(null);
  const [filter, setFilter] = useState<'全部' | MaterialStatus>('全部');
  if (loading || !data) return <LoadingState />;
  const writable = can('execution.write');

  const list = filter === '全部' ? data.materials : data.materials.filter(material => material.status === filter);
  const save = () => {
    if (!writable || !editing?.name.trim()) return;
    const normalized = {
      ...editing,
      quantity: Math.max(0, editing.quantity),
      checkedQuantity: Math.max(0, Math.min(editing.quantity, editing.checkedQuantity)),
      returnedQuantity: Math.max(0, Math.min(editing.quantity, editing.returnedQuantity ?? 0))
    };
    updateCollection('materials', rows => rows.some(material => material.id === normalized.id) ? rows.map(material => material.id === normalized.id ? normalized : material) : [...rows, normalized]);
    setEditing(null);
  };
  const patch = (id: string, patchValue: Partial<MaterialItem>) => {
    if (!writable) return;
    updateCollection('materials', rows => rows.map(material => material.id === id ? { ...material, ...patchValue } : material));
  };

  return <div className="page">
    <PageHeader eyebrow="MATERIAL LOGISTICS" title="物料清单" description="贯通采购、验收、装箱、运输、交接、到场和回收，形成完整责任链。" actions={<button className="button" disabled={!writable} onClick={() => setEditing(blank())}><Icon name="plus" />新增物料</button>} />
    <section className="stats-grid"><article className="metric panel"><span>物料项目</span><strong>{data.materials.length}</strong><small>跨采购与现场</small></article><article className="metric panel"><span>运输中</span><strong>{data.materials.filter(material => material.transportStatus === '运输中').length}</strong><small>需要跟踪车辆</small></article><article className="metric panel"><span>待验收</span><strong>{data.materials.filter(material => material.status === '待验收').length}</strong><small>数量与质量复核</small></article><article className="metric panel"><span>待回收</span><strong>{data.materials.filter(material => material.returnRequired && material.transportStatus !== '已回收').length}</strong><small>婚礼结束后交接</small></article></section>
    <section className="toolbar panel"><div className="tabs">{(['全部', '待采购', '采购中', '已到货', '待验收', '已验收'] as const).map(value => <button key={value} className={filter === value ? 'is-active' : ''} onClick={() => setFilter(value)}>{value}</button>)}</div></section>
    <section className="panel table-card"><div className="table-scroll"><table className="data-table"><thead><tr><th>物料</th><th>分类</th><th>计划 / 验收</th><th>负责人 / 交接</th><th>存放地点</th><th>装箱码</th><th>运输</th><th>采购状态</th><th /></tr></thead><tbody>{list.map(material => <tr key={material.id}>
      <td><strong>{material.name}</strong><small>{material.note}</small></td><td>{material.category}</td>
      <td>{material.quantity} / <input className="cell-sm" disabled={!writable} type="number" min="0" max={material.quantity} value={material.checkedQuantity} onChange={event => patch(material.id, { checkedQuantity: Math.max(0, Math.min(material.quantity, Number(event.target.value))) })} /> {material.unit}</td>
      <td>{material.owner}<small>{material.handoverTo ? `交接：${material.handoverTo}` : '未设置交接人'}</small></td><td>{material.storageLocation || '—'}</td>
      <td><input className="cell-code" disabled={!writable} value={material.boxCode} onChange={event => patch(material.id, { boxCode: event.target.value })} /></td>
      <td><select disabled={!writable} value={material.transportStatus ?? '未装箱'} onChange={event => patch(material.id, { transportStatus: event.target.value as TransportStatus })}>{transportStatuses.map(value => <option key={value}>{value}</option>)}</select></td>
      <td><select disabled={!writable} value={material.status} onChange={event => patch(material.id, { status: event.target.value as MaterialStatus })}>{['待采购', '采购中', '已到货', '待验收', '已验收'].map(value => <option key={value}>{value}</option>)}</select></td>
      <td><button className="icon-button" disabled={!writable} aria-label={`编辑物料 ${material.name}`} onClick={() => setEditing(material)}><Icon name="edit" /></button></td>
    </tr>)}</tbody></table></div></section>
    <Modal open={Boolean(editing)} title="物料档案" onClose={() => setEditing(null)} footer={<><button className="button button--ghost" onClick={() => setEditing(null)}>取消</button>{editing && data.materials.some(material => material.id === editing.id) && <button className="button button--danger" disabled={!writable} onClick={() => { if (!writable) return; updateCollection('materials', rows => rows.filter(material => material.id !== editing.id)); setEditing(null); }}>删除</button>}<button className="button" disabled={!writable} onClick={save}>保存</button></>}>
      {editing && <fieldset disabled={!writable} className="form-grid operations-form-fieldset"><label><span>物料名称</span><input value={editing.name} onChange={event => setEditing({ ...editing, name: event.target.value })} /></label><label><span>分类</span><input value={editing.category} onChange={event => setEditing({ ...editing, category: event.target.value })} /></label><label><span>数量</span><input type="number" min="0" value={editing.quantity} onChange={event => setEditing({ ...editing, quantity: Math.max(0, Number(event.target.value)) })} /></label><label><span>单位</span><input value={editing.unit} onChange={event => setEditing({ ...editing, unit: event.target.value })} /></label><label><span>负责人</span><input value={editing.owner} onChange={event => setEditing({ ...editing, owner: event.target.value })} /></label><label><span>交接人</span><input value={editing.handoverTo ?? ''} onChange={event => setEditing({ ...editing, handoverTo: event.target.value })} /></label><label><span>供应商</span><input value={editing.supplier} onChange={event => setEditing({ ...editing, supplier: event.target.value })} /></label><label><span>预计到货</span><input type="date" value={editing.expectedDate} onChange={event => setEditing({ ...editing, expectedDate: event.target.value })} /></label><label><span>采购状态</span><select value={editing.status} onChange={event => setEditing({ ...editing, status: event.target.value as MaterialStatus })}>{['待采购', '采购中', '已到货', '待验收', '已验收'].map(value => <option key={value}>{value}</option>)}</select></label><label><span>运输状态</span><select value={editing.transportStatus ?? '未装箱'} onChange={event => setEditing({ ...editing, transportStatus: event.target.value as TransportStatus })}>{transportStatuses.map(value => <option key={value}>{value}</option>)}</select></label><label><span>验收数量</span><input type="number" min="0" max={editing.quantity} value={editing.checkedQuantity} onChange={event => setEditing({ ...editing, checkedQuantity: Number(event.target.value) })} /></label><label><span>装箱码</span><input value={editing.boxCode} onChange={event => setEditing({ ...editing, boxCode: event.target.value })} /></label><label className="form-wide"><span>存放地点</span><input value={editing.storageLocation ?? ''} onChange={event => setEditing({ ...editing, storageLocation: event.target.value })} /></label><label><span>需要回收</span><select value={editing.returnRequired ? '是' : '否'} onChange={event => setEditing({ ...editing, returnRequired: event.target.value === '是' })}><option>否</option><option>是</option></select></label><label><span>已回收数量</span><input type="number" min="0" max={editing.quantity} value={editing.returnedQuantity ?? 0} onChange={event => setEditing({ ...editing, returnedQuantity: Number(event.target.value) })} /></label><label className="form-wide"><span>备注</span><textarea value={editing.note} onChange={event => setEditing({ ...editing, note: event.target.value })} /></label></fieldset>}
    </Modal>
  </div>;
}
