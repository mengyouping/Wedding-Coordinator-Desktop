import { useState } from 'react';
import { Icon } from '../../components/Icon';
import { LoadingState } from '../../components/LoadingState';
import { Modal } from '../../components/Modal';
import { PageHeader } from '../../components/PageHeader';
import { createId } from '../../lib/id';
import { useWeddingData } from '../../state/WeddingDataProvider';
import type { Guest, SeatAssignment, SeatingPlan, TableStatus, WeddingTable } from '../../types/domain';
import { generateSeatingPlan, scoreSeatingPlan } from './constraintSolver';
import { evaluateTableAssignment } from './seatingRules';

const blank = (): WeddingTable => ({
  id: createId('table'), name: '新桌', zone: '主厅', capacity: 10, shape: '圆桌', status: '空闲', note: '',
  tableNo: '', x: 0, y: 0, rotation: 0, accessible: false
});

export function SeatingPage() {
  const { data, loading, updateCollection, updateDatabase, can } = useWeddingData();
  const [editing, setEditing] = useState<WeddingTable | null>(null);
  const [notice, setNotice] = useState('');
  if (loading || !data) return <LoadingState />;
  const writable = can('seating.write');
  const activateWritable = writable && can('project.write');

  const assigned = new Set(data.seatAssignments.map(item => item.guestId));
  const waiting = data.guests.filter(guest => guest.rsvp === '已确认' && !assigned.has(guest.id));
  const tableAssignments = (tableId: string) => data.seatAssignments.filter(item => item.tableId === tableId);
  const assignmentSize = (assignment: SeatAssignment) => 1 + Math.max(0, assignment.companionCount);
  const occupancy = (tableId: string) => tableAssignments(tableId).reduce((sum, assignment) => sum + assignmentSize(assignment), 0);
  const currentScore = scoreSeatingPlan(data.guests.filter(item => item.rsvp === '已确认'), data.tables, data.seatAssignments);

  const save = () => {
    if (!writable || !editing?.name.trim()) return;
    updateCollection('tables', list => list.some(table => table.id === editing.id) ? list.map(table => table.id === editing.id ? editing : table) : [...list, editing]);
    setEditing(null);
  };

  const assign = (guest: Guest, tableId: string) => {
    if (!writable) return;
    const existing = data.seatAssignments.find(item => item.guestId === guest.id);
    const partySize = 1 + Math.max(0, guest.companions);
    if (!tableId) {
      const sourceTable = data.tables.find(table => table.id === existing?.tableId);
      if (sourceTable?.status === '已锁定') {
        setNotice('桌位已锁定，请先解锁后再移除宾客。');
        return;
      }
    } else {
      const target = data.tables.find(table => table.id === tableId);
      if (!target) {
        setNotice('目标桌位不存在，请刷新后重试。');
        return;
      }
      const usedWithoutGuest = occupancy(tableId) - (existing?.tableId === tableId ? assignmentSize(existing) : 0);
      const evaluation = evaluateTableAssignment(target, usedWithoutGuest, partySize);
      if (!evaluation.allowed) {
        setNotice(evaluation.reason);
        return;
      }
    }
    updateDatabase(database => {
      const current = database.seatAssignments.find(item => item.guestId === guest.id);
      const withoutGuest = database.seatAssignments.filter(item => item.guestId !== guest.id);
      if (!tableId) return { ...database, seatAssignments: withoutGuest };
      const assignment: SeatAssignment = {
        id: current?.id ?? createId('seat'), guestId: guest.id, tableId,
        seatNo: current?.seatNo ?? '', companionCount: guest.companions
      };
      return { ...database, seatAssignments: [...withoutGuest, assignment] };
    });
  };

  const generatePlan = () => {
    if (!writable) return;
    if (!data.tables.length) {
      setNotice('请先新增至少一个桌位，再生成排桌方案。');
      return;
    }
    const plan = generateSeatingPlan(data.guests, data.tables, data.seatAssignments);
    updateCollection('seatingPlans', list => [...list.map(item => ({ ...item, active: false })), plan]);
    setNotice(`新方案评分 ${plan.score} 分，硬约束问题 ${plan.hardViolations.length} 项。请确认后再激活。`);
  };

  const activatePlan = (plan: SeatingPlan) => {
    if (!activateWritable) {
      setNotice('激活方案会同时修改桌位和项目设置，需要排桌写权限与项目写权限。');
      return;
    }
    if (plan.hardViolations.length) {
      setNotice('该方案仍有硬约束问题，不能激活。');
      return;
    }
    const lockedTableIds = new Set(data.tables.filter(table => table.status === '已锁定').map(table => table.id));
    const lockedCurrent = data.seatAssignments.filter(item => lockedTableIds.has(item.tableId)).map(item => `${item.guestId}:${item.tableId}:${item.seatNo}`).sort();
    const lockedNext = plan.assignments.filter(item => lockedTableIds.has(item.tableId)).map(item => `${item.guestId}:${item.tableId}:${item.seatNo}`).sort();
    if (JSON.stringify(lockedCurrent) !== JSON.stringify(lockedNext)) {
      setNotice('该方案会改动已锁定桌位，请先解锁对应桌位后再激活。');
      return;
    }
    updateDatabase(database => ({
      ...database,
      seatAssignments: structuredClone(plan.assignments),
      seatingPlans: database.seatingPlans.map(item => ({ ...item, active: item.id === plan.id })),
      settings: { ...database.settings, activeSeatingPlanId: plan.id }
    }));
    setNotice(`已激活排桌方案：${plan.name}`);
  };

  const updateSeat = (assignmentId: string, seatNo: string) => {
    if (!writable) return;
    const assignment = data.seatAssignments.find(item => item.id === assignmentId);
    const table = data.tables.find(item => item.id === assignment?.tableId);
    if (table?.status === '已锁定') {
      setNotice('桌位已锁定，请先解锁后再修改座位号。');
      return;
    }
    updateCollection('seatAssignments', list => list.map(item => item.id === assignmentId ? { ...item, seatNo } : item));
  };

  const removeTable = (id: string) => {
    if (!writable) return;
    const table = data.tables.find(item => item.id === id);
    if (table?.status === '已锁定') {
      setNotice('锁定桌位不能删除，请先解锁。');
      return;
    }
    if (!window.confirm('删除桌位会同步清理当前座位关系和已保存方案中的对应安排，确认继续吗？')) return;
    updateDatabase(database => ({
      ...database,
      tables: database.tables.filter(item => item.id !== id),
      seatAssignments: database.seatAssignments.filter(item => item.tableId !== id),
      seatingPlans: database.seatingPlans.map(plan => ({ ...plan, assignments: plan.assignments.filter(item => item.tableId !== id) }))
    }));
    setEditing(null);
  };

  return <div className="page">
    <PageHeader eyebrow="SEATING INTELLIGENCE" title="排桌座位" description="硬约束保证容量、锁定、必须同桌与禁止同桌；软约束根据偏好、无障碍和区域关系给出评分与解释。" actions={<><button className="button button--ghost" disabled={!writable} onClick={generatePlan}><Icon name="sparkles" />生成约束方案</button><button className="button" disabled={!writable} onClick={() => setEditing(blank())}><Icon name="plus" />新增桌位</button></>} />
    {notice && <div className="global-alert" role={/需要|不能|锁定|不存在|超出/.test(notice) ? 'alert' : 'status'}><Icon name={/需要|不能|锁定|不存在|超出/.test(notice) ? 'warning' : 'check'} /><span>{notice}</span><button onClick={() => setNotice('')}>关闭</button></div>}
    <section className="stats-grid"><article className="metric panel"><span>当前方案评分</span><strong>{currentScore.score}</strong><small>{currentScore.hardViolations.length} 个硬约束问题</small></article><article className="metric panel"><span>已保存方案</span><strong>{data.seatingPlans.length}</strong><small>{data.settings.activeSeatingPlanId ? '已有激活方案' : '尚未激活方案'}</small></article><article className="metric panel"><span>待安排</span><strong>{waiting.length}</strong><small>已确认但未入桌</small></article><article className="metric panel"><span>容量告警</span><strong>{data.tables.filter(table => occupancy(table.id) > table.capacity).length}</strong><small>需立即处理</small></article></section>

    <section className="panel seating-plan-section"><header><div><span className="eyebrow">SEATING SCENARIOS</span><h2>排桌方案</h2></div><span>{data.seatingPlans.length}</span></header><div className="seating-plan-list">{data.seatingPlans.length ? data.seatingPlans.slice().reverse().map(plan => <article key={plan.id} className={plan.active ? 'is-active' : ''}><div><strong>{plan.name}</strong><span>评分 {plan.score} · {plan.assignments.length} 个邀请户 · {plan.hardViolations.length} 个硬约束问题</span><small>{plan.hardViolations[0] ?? plan.explanations[0] ?? '暂无解释'}</small></div><button className="button button--ghost" title={activateWritable ? '激活方案' : '需要排桌写权限与项目写权限'} disabled={!activateWritable || plan.active || Boolean(plan.hardViolations.length)} onClick={() => activatePlan(plan)}>{plan.active ? '当前方案' : '激活方案'}</button></article>) : <p>尚未生成排桌方案。</p>}</div></section>

    <section className="seating-layout">
      <aside className="panel guest-pool"><header><div><span className="eyebrow">GUEST POOL</span><h2>待排宾客</h2></div><span>{waiting.length}</span></header>{waiting.map(guest => <div className="pool-item" key={guest.id}><span><strong>{guest.name}</strong><small>{guest.group} · {guest.companions + 1} 人{guest.accessibilityNeed ? ` · ${guest.accessibilityNeed}` : ''}</small></span><select disabled={!writable} defaultValue="" onChange={event => event.target.value && assign(guest, event.target.value)}><option value="">安排到…</option>{data.tables.filter(table => evaluateTableAssignment(table, occupancy(table.id), guest.companions + 1).allowed).map(table => <option key={table.id} value={table.id}>{table.name}{table.accessible ? ' · 无障碍' : ''}</option>)}</select></div>)}</aside>
      <div className="table-grid">{data.tables.map(table => {
        const used = occupancy(table.id);
        const assignments = tableAssignments(table.id);
        const locked = table.status === '已锁定';
        return <article className={`wedding-table panel interactive-card ${used > table.capacity ? 'is-over' : ''}`} key={table.id} style={{ '--table-x': table.x ?? 0, '--table-y': table.y ?? 0 } as React.CSSProperties}>
          <header><div><span>{table.zone} · {table.tableNo || '未编号'}</span><h3>{table.name}</h3></div><button className="icon-button" disabled={!writable} aria-label={`编辑桌位 ${table.name}`} onClick={() => setEditing(table)}><Icon name="edit" /></button></header>
          <div className="table-visual" style={{ transform: `rotate(${table.rotation ?? 0}deg)` }}><span>{used}<small>/{table.capacity}</small></span><i style={{ transform: `scale(${Math.min(1, used / Math.max(1, table.capacity))})` }} /></div>
          <div className="seat-list">{assignments.map(assignment => {
            const guest = data.guests.find(item => item.id === assignment.guestId);
            return guest ? <div className="seat-entry" key={assignment.id}><button disabled={!writable || locked} title={locked ? '桌位已锁定' : '移除桌位'} aria-label={`移除 ${guest.name} 的桌位`} onClick={() => assign(guest, '')}><b>{guest.name.slice(0, 1)}</b><span>{guest.name}<small>{guest.companions + 1}人</small></span></button><input disabled={!writable || locked} title={locked ? '桌位已锁定' : '修改座位号'} aria-label={`${guest.name} 座位号`} placeholder="座位" value={assignment.seatNo} onChange={event => updateSeat(assignment.id, event.target.value)} /></div> : null;
          })}</div>
          <footer><span className={`status status--${table.status}`}>{table.status}</span><small>{table.shape} · {table.accessible ? '无障碍' : '常规'} · {table.note || '暂无备注'}</small></footer>
        </article>;
      })}</div>
    </section>
    <Modal open={Boolean(editing)} title="桌位设置" onClose={() => setEditing(null)} footer={<><button className="button button--ghost" onClick={() => setEditing(null)}>取消</button>{editing && data.tables.some(table => table.id === editing.id) && <button className="button button--danger" disabled={!writable} onClick={() => removeTable(editing.id)}>删除</button>}<button className="button" disabled={!writable} onClick={save}>保存</button></>}>
      {editing && <fieldset disabled={!writable} className="form-grid operations-form-fieldset"><label><span>桌名</span><input value={editing.name} onChange={event => setEditing({ ...editing, name: event.target.value })} /></label><label><span>桌号</span><input value={editing.tableNo ?? ''} onChange={event => setEditing({ ...editing, tableNo: event.target.value })} /></label><label><span>区域</span><input value={editing.zone} onChange={event => setEditing({ ...editing, zone: event.target.value })} /></label><label><span>容量</span><input type="number" min="1" value={editing.capacity} onChange={event => setEditing({ ...editing, capacity: Math.max(1, Number(event.target.value)) })} /></label><label><span>桌型</span><select value={editing.shape} onChange={event => setEditing({ ...editing, shape: event.target.value as WeddingTable['shape'] })}><option>圆桌</option><option>方桌</option></select></label><label><span>状态</span><select value={editing.status} onChange={event => setEditing({ ...editing, status: event.target.value as TableStatus })}><option>空闲</option><option>编排中</option><option>已锁定</option></select></label><label><span>X 坐标</span><input type="number" value={editing.x ?? 0} onChange={event => setEditing({ ...editing, x: Number(event.target.value) })} /></label><label><span>Y 坐标</span><input type="number" value={editing.y ?? 0} onChange={event => setEditing({ ...editing, y: Number(event.target.value) })} /></label><label><span>旋转角度</span><input type="number" min="0" max="360" value={editing.rotation ?? 0} onChange={event => setEditing({ ...editing, rotation: Number(event.target.value) })} /></label><label className="switch"><input type="checkbox" checked={Boolean(editing.accessible)} onChange={event => setEditing({ ...editing, accessible: event.target.checked })} /><span>无障碍桌位</span></label><label className="form-wide"><span>备注</span><textarea value={editing.note} onChange={event => setEditing({ ...editing, note: event.target.value })} /></label></fieldset>}
    </Modal>
  </div>;
}