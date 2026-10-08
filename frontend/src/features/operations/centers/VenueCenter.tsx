import { useMemo, useState } from 'react';
import { Icon } from '../../../components/Icon';
import { OperationsSummary } from '../components/OperationsSummary';
import { VenueDeploymentCanvas } from '../components/VenueDeploymentCanvas';
import { operationsStatuses } from '../components/StatusSelect';
import type { VenueDeployment } from '../model';
import { operationId } from '../model';

export function VenueCenter({ rows, onChange }: { rows: VenueDeployment[]; onChange(rows: VenueDeployment[]): void }) {
  const [selectedId, setSelectedId] = useState(rows[0]?.id ?? '');
  const selected = rows.find(item => item.id === selectedId) ?? rows[0];
  const floorGroups = useMemo(() => [...new Set(rows.map(item => item.floor))], [rows]);
  const fireAccess = rows.filter(item => item.fireAccess).length;
  const powerItems = rows.filter(item => item.power && item.power !== '无').length;
  const risks = rows.filter(item => item.status === '有风险').length;
  const patch = (id: string, value: Partial<VenueDeployment>) => onChange(rows.map(item => item.id === id ? { ...item, ...value } : item));
  const duplicate = (row: VenueDeployment) => {
    const copy = { ...structuredClone(row), id: operationId('zone'), name: `${row.name}副本`, x: Math.min(90, row.x + 3), y: Math.min(90, row.y + 3) };
    onChange([...rows, copy]);
    setSelectedId(copy.id);
  };
  const add = () => {
    const created: VenueDeployment = { id: operationId('zone'), name: '新增部署对象', category: '其他', floor: '宴会层', zone: '', x: 40, y: 40, width: 16, height: 10, rotation: 0, power: '无', fireAccess: false, owner: '', status: '待确认', note: '' };
    onChange([...rows, created]);
    setSelectedId(created.id);
  };

  return <div className="operations-center">
    <OperationsSummary metrics={[
      { label: '部署对象', value: rows.length, detail: `${floorGroups.length} 个楼层/区域`, icon: <Icon name="seating" /> },
      { label: '消防与主通道', value: fireAccess, detail: '必须全程保持畅通', tone: fireAccess ? 'success' : 'danger', icon: <Icon name="risk" /> },
      { label: '需要用电', value: powerItems, detail: '需和酒店工程及婚庆核对回路', icon: <Icon name="settings" /> },
      { label: '部署风险', value: risks, detail: '位置、用电、消防或动线待处理', tone: risks ? 'danger' : 'success', icon: <Icon name="warning" /> }
    ]} />

    <section className="operations-venue-layout">
      <article className="panel operations-section operations-venue-map"><header><div><span className="eyebrow">VENUE DEPLOYMENT MAP</span><h2>场地可视化部署地图</h2><p>拖动对象调整百分比坐标；正式数据结构确定后可扩展吸附、缩放、楼层切换和图片底图。</p></div><button className="button" onClick={add}><Icon name="plus" />新增对象</button></header><VenueDeploymentCanvas rows={rows} selectedId={selected?.id ?? ''} onSelect={setSelectedId} onChange={onChange} /><div className="venue-map-legend"><span>舞台/仪式</span><span>宾客/餐饮</span><span>技术/影像</span><span>物流/安全</span><em>拖动对象即可调整位置</em></div></article>

      <aside className="panel operations-section venue-property-panel"><header><div><span className="eyebrow">SELECTED OBJECT</span><h2>{selected?.name ?? '未选择对象'}</h2></div>{selected && <div className="operations-row-actions"><button className="icon-button" title="复制" onClick={() => duplicate(selected)}><Icon name="copy" /></button><button className="icon-button icon-button--danger" title="删除" onClick={() => { if (!window.confirm('确认删除该部署对象吗？')) return; onChange(rows.filter(item => item.id !== selected.id)); setSelectedId(rows.find(item => item.id !== selected.id)?.id ?? ''); }}><Icon name="trash" /></button></div>}</header>{selected && <div className="form-grid venue-property-form">
        <label className="form-wide"><span>名称</span><input value={selected.name} onChange={event => patch(selected.id, { name: event.target.value })} /></label>
        <label><span>类别</span><input value={selected.category} onChange={event => patch(selected.id, { category: event.target.value })} /></label>
        <label><span>楼层</span><input value={selected.floor} onChange={event => patch(selected.id, { floor: event.target.value })} /></label>
        <label className="form-wide"><span>区域说明</span><input value={selected.zone} onChange={event => patch(selected.id, { zone: event.target.value })} /></label>
        <label><span>X 坐标 %</span><input type="number" min="0" max="100" value={selected.x} onChange={event => patch(selected.id, { x: Math.max(0, Math.min(100 - selected.width, Number(event.target.value))) })} /></label>
        <label><span>Y 坐标 %</span><input type="number" min="0" max="100" value={selected.y} onChange={event => patch(selected.id, { y: Math.max(0, Math.min(100 - selected.height, Number(event.target.value))) })} /></label>
        <label><span>宽度 %</span><input type="number" min="3" max="100" value={selected.width} onChange={event => patch(selected.id, { width: Math.max(3, Math.min(100 - selected.x, Number(event.target.value))) })} /></label>
        <label><span>高度 %</span><input type="number" min="3" max="100" value={selected.height} onChange={event => patch(selected.id, { height: Math.max(3, Math.min(100 - selected.y, Number(event.target.value))) })} /></label>
        <label><span>旋转角度</span><input type="number" min="0" max="360" value={selected.rotation} onChange={event => patch(selected.id, { rotation: Number(event.target.value) })} /></label>
        <label><span>用电需求</span><input value={selected.power} onChange={event => patch(selected.id, { power: event.target.value })} /></label>
        <label><span>负责人</span><input value={selected.owner} onChange={event => patch(selected.id, { owner: event.target.value })} /></label>
        <label><span>状态</span><select value={selected.status} onChange={event => patch(selected.id, { status: event.target.value as VenueDeployment['status'] })}>{operationsStatuses.map(value => <option key={value}>{value}</option>)}</select></label>
        <label className="switch form-wide"><input type="checkbox" checked={selected.fireAccess} onChange={event => patch(selected.id, { fireAccess: event.target.checked })} /><span>属于消防出口、主通道或必须保持畅通的区域</span></label>
        <label className="form-wide"><span>部署与验收说明</span><textarea value={selected.note} onChange={event => patch(selected.id, { note: event.target.value })} /></label>
      </div>}</aside>
    </section>

    <section className="panel operations-section"><header><div><span className="eyebrow">DEPLOYMENT REGISTER</span><h2>区域与设备部署清单</h2></div></header><div className="operations-card-list">{rows.map(item => <button key={item.id} className={selected?.id === item.id ? 'is-active' : ''} onClick={() => setSelectedId(item.id)}><span><strong>{item.name}</strong><small>{item.floor} · {item.zone || item.category}</small></span><em>{item.power}</em><i>{item.status}</i></button>)}</div></section>
  </div>;
}
