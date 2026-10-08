import { useRef, useState } from 'react';
import { Icon } from '../../components/Icon';
import { LoadingState } from '../../components/LoadingState';
import { MaskedText } from '../../components/MaskedText';
import { Modal } from '../../components/Modal';
import { PageHeader } from '../../components/PageHeader';
import { createId } from '../../lib/id';
import { number } from '../../lib/format';
import { useWeddingData } from '../../state/WeddingDataProvider';
import type { Guest, RsvpStatus, SeatAssignment } from '../../types/domain';
import { evaluateTableAssignment } from '../seating/seatingRules';
import { guestsToCsv, parseGuestCsv } from '../shared/csv';

const blank = (): Guest => ({
  id: createId('guest'), name: '', side: '共同', group: '朋友', householdName: '', rsvp: '待回复',
  companions: 0, children: 0, phone: '', dietary: '', transportNeed: '', accommodationNeed: '',
  accessibilityNeed: '', preferredTableIds: [], mustSitWithGuestIds: [], avoidGuestIds: [], note: ''
});

export function GuestsPage() {
  const { data, loading, updateCollection, updateDatabase, can } = useWeddingData();
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<'全部' | RsvpStatus>('全部');
  const [editing, setEditing] = useState<Guest | null>(null);
  const [notice, setNotice] = useState('');
  const csvInput = useRef<HTMLInputElement>(null);
  if (loading || !data) return <LoadingState />;
  const writable = can('guest.write');
  const seatingWritable = can('seating.write');
  const executionWritable = can('execution.write');
  const deleteWritable = writable && seatingWritable && executionWritable;
  const exportable = can('privacy.export');

  const guests = data.guests.filter(guest =>
    (status === '全部' || guest.rsvp === status)
    && `${guest.name}${guest.householdName ?? ''}${guest.group}${guest.phone}`.toLowerCase().includes(query.toLowerCase())
  );
  const assignments = new Map(data.seatAssignments.map(item => [item.guestId, item]));
  const occupancy = (tableId: string) => data.seatAssignments
    .filter(item => item.tableId === tableId)
    .reduce((sum, item) => sum + 1 + Math.max(0, item.companionCount), 0);
  const confirmed = data.guests.filter(guest => guest.rsvp === '已确认').reduce((sum, guest) => sum + 1 + guest.companions, 0);

  const tableEvaluation = (guest: Guest, tableId: string) => {
    const table = data.tables.find(item => item.id === tableId);
    if (!table) return { allowed: false, reason: '目标桌位不存在，请刷新后重试。' };
    const existing = assignments.get(guest.id);
    const existingSize = existing?.tableId === tableId ? 1 + Math.max(0, existing.companionCount) : 0;
    return evaluateTableAssignment(table, occupancy(tableId) - existingSize, 1 + Math.max(0, guest.companions));
  };

  const save = () => {
    if (!writable || !editing?.name.trim()) return;
    const updateGuests = (list: Guest[]) => list.some(guest => guest.id === editing.id)
      ? list.map(guest => guest.id === editing.id ? editing : guest)
      : [...list, editing];
    const existingSeat = data.seatAssignments.find(item => item.guestId === editing.id);
    if (existingSeat && seatingWritable) {
      const evaluation = tableEvaluation(editing, existingSeat.tableId);
      if (!evaluation.allowed) {
        setNotice(`宾客资料未保存：${evaluation.reason}`);
        return;
      }
      updateDatabase(database => ({
        ...database,
        guests: updateGuests(database.guests),
        seatAssignments: database.seatAssignments.map(item => item.guestId === editing.id ? { ...item, companionCount: editing.companions } : item)
      }));
    } else {
      updateCollection('guests', updateGuests);
    }
    setEditing(null);
  };

  const patch = (id: string, patchValue: Partial<Guest>) => {
    if (!writable) return;
    updateCollection('guests', list => list.map(guest => guest.id === id ? { ...guest, ...patchValue } : guest));
  };

  const assignTable = (guest: Guest, tableId: string) => {
    if (!seatingWritable) return;
    const existing = assignments.get(guest.id);
    if (!tableId) {
      const sourceTable = data.tables.find(item => item.id === existing?.tableId);
      if (sourceTable?.status === '已锁定') {
        setNotice('桌位已锁定，请先在排桌页面解锁后再移除宾客。');
        return;
      }
    } else {
      const evaluation = tableEvaluation(guest, tableId);
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

  const removeGuest = (id: string) => {
    if (!deleteWritable) {
      setNotice('删除宾客会同时清理桌位、排桌方案和请帖，需要宾客、排桌和执行写权限。');
      return;
    }
    if (!window.confirm('删除宾客会同时删除桌位关系和专属请帖，确认继续吗？')) return;
    updateDatabase(database => ({
      ...database,
      guests: database.guests.filter(guest => guest.id !== id).map(guest => ({
        ...guest,
        mustSitWithGuestIds: (guest.mustSitWithGuestIds ?? []).filter(guestId => guestId !== id),
        avoidGuestIds: (guest.avoidGuestIds ?? []).filter(guestId => guestId !== id)
      })),
      seatAssignments: database.seatAssignments.filter(item => item.guestId !== id),
      seatingPlans: database.seatingPlans.map(plan => ({ ...plan, assignments: plan.assignments.filter(item => item.guestId !== id) })),
      invitations: database.invitations.filter(item => item.guestId !== id)
    }));
    setEditing(null);
  };

  const toggleConstraint = (key: 'preferredTableIds' | 'mustSitWithGuestIds' | 'avoidGuestIds', id: string) => {
    if (!editing || !writable) return;
    const current = editing[key] ?? [];
    setEditing({ ...editing, [key]: current.includes(id) ? current.filter(item => item !== id) : [...current, id] });
  };

  const exportCsv = () => {
    if (!exportable) return;
    const url = URL.createObjectURL(new Blob([guestsToCsv(data.guests)], { type: 'text/csv;charset=utf-8' }));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = '婚礼宾客名单.csv';
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const importCsv = async (file: File) => {
    if (!writable) return;
    try {
      const imported = parseGuestCsv(await file.text()).map(guest => ({
        ...guest, accessibilityNeed: '', preferredTableIds: [], mustSitWithGuestIds: [], avoidGuestIds: []
      }));
      updateDatabase(database => {
        const existingPhones = new Set(database.guests.map(guest => guest.phone).filter(Boolean));
        const fresh = imported.filter(guest => !guest.phone || !existingPhones.has(guest.phone));
        return { ...database, guests: [...database.guests, ...fresh] };
      });
      setNotice(`已读取 ${imported.length} 条宾客记录；重复手机号不会重复加入。`);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'CSV 导入失败');
    }
  };

  return <div className="page">
    <PageHeader eyebrow="GUEST EXPERIENCE" title="宾客与 RSVP" description="维护家庭、携客、儿童、隐私、无障碍需求、回执与高级排桌约束。" actions={<>
      <button className="button button--ghost" disabled={!writable} onClick={() => csvInput.current?.click()}><Icon name="upload" />导入 CSV</button>
      <input ref={csvInput} hidden type="file" accept=".csv,text/csv" onChange={event => { const file = event.target.files?.[0]; if (file) void importCsv(file); event.currentTarget.value = ''; }} />
      <button className="button button--ghost" disabled={!exportable} onClick={exportCsv}><Icon name="download" />导出 CSV</button>
      <button className="button" disabled={!writable} onClick={() => setEditing(blank())}><Icon name="plus" />新增宾客</button>
    </>} />
    {notice && <div className="global-alert" role={/失败|需要|锁定|超出|不存在|未保存/.test(notice) ? 'alert' : 'status'}><Icon name={/失败|需要|锁定|超出|不存在|未保存/.test(notice) ? 'warning' : 'check'} /><span>{notice}</span><button onClick={() => setNotice('')}>关闭</button></div>}
    <section className="stats-grid"><article className="metric panel"><span>宾客记录</span><strong>{data.guests.length}</strong><small>联系人 / 家庭 / 群组</small></article><article className="metric panel"><span>确认人数</span><strong>{number.format(confirmed)}</strong><small>含携客人数</small></article><article className="metric panel"><span>无障碍需求</span><strong>{data.guests.filter(guest => guest.accessibilityNeed?.trim()).length}</strong><small>排桌优先安排无障碍桌</small></article><article className="metric panel"><span>已排桌</span><strong>{data.seatAssignments.length}</strong><small>唯一排桌关系</small></article></section>
    <section className="toolbar panel"><label className="search-box"><Icon name="search" /><input placeholder="搜索姓名、家庭、关系或手机" value={query} onChange={event => setQuery(event.target.value)} /></label><div className="tabs">{(['全部', '已确认', '待回复', '不出席'] as const).map(value => <button key={value} className={status === value ? 'is-active' : ''} onClick={() => setStatus(value)}>{value}</button>)}</div></section>
    <section className="panel table-card"><div className="table-scroll"><table className="data-table"><thead><tr><th>宾客 / 家庭</th><th>归属</th><th>关系组</th><th>回执</th><th>人数</th><th>联系电话</th><th>桌位</th><th>特殊需求</th><th /></tr></thead><tbody>{guests.map(guest => {
      const assignment = assignments.get(guest.id);
      const assignedTable = data.tables.find(table => table.id === assignment?.tableId);
      const tableLocked = assignedTable?.status === '已锁定';
      return <tr key={guest.id}><td><strong>{guest.name}</strong><small>{guest.householdName || guest.note}</small></td><td>{guest.side}</td><td>{guest.group}</td><td><select disabled={!writable} value={guest.rsvp} onChange={event => patch(guest.id, { rsvp: event.target.value as RsvpStatus })}><option>已确认</option><option>待回复</option><option>不出席</option></select></td><td>{1 + guest.companions} 人{guest.children ? ` · ${guest.children} 儿童` : ''}</td><td><MaskedText value={guest.phone} label={`${guest.name}联系电话`} masked={data.settings.maskSensitiveByDefault} /></td><td><select title={tableLocked ? '桌位已锁定，请先到排桌页面解锁' : '调整桌位'} disabled={!seatingWritable || tableLocked} value={assignment?.tableId ?? ''} onChange={event => assignTable(guest, event.target.value)}><option value="">未排桌</option>{data.tables.filter(table => table.id === assignment?.tableId || tableEvaluation(guest, table.id).allowed).map(table => <option key={table.id} value={table.id}>{table.name}{table.status === '已锁定' ? ' · 已锁定' : ''}</option>)}</select></td><td>{[guest.dietary, guest.accessibilityNeed].filter(Boolean).join(' · ') || '无'}</td><td><button className="icon-button" disabled={!writable} aria-label={`编辑宾客 ${guest.name}`} onClick={() => setEditing(guest)}><Icon name="edit" /></button></td></tr>;
    })}</tbody></table></div></section>
    <Modal open={Boolean(editing)} title="宾客资料" onClose={() => setEditing(null)} footer={<><button className="button button--ghost" onClick={() => setEditing(null)}>取消</button>{editing && data.guests.some(guest => guest.id === editing.id) && <button className="button button--danger" disabled={!deleteWritable} title={deleteWritable ? '删除宾客' : '需要宾客、排桌和执行写权限'} onClick={() => removeGuest(editing.id)}>删除</button>}<button className="button" disabled={!writable} onClick={save}>保存</button></>}>
      {editing && <fieldset disabled={!writable} className="form-grid operations-form-fieldset"><label><span>姓名 / 群组</span><input value={editing.name} onChange={event => setEditing({ ...editing, name: event.target.value })} /></label><label><span>家庭 / 邀请户</span><input value={editing.householdName ?? ''} onChange={event => setEditing({ ...editing, householdName: event.target.value })} /></label><label><span>联系电话</span><input value={editing.phone} onChange={event => setEditing({ ...editing, phone: event.target.value })} /></label><label><span>归属</span><select value={editing.side} onChange={event => setEditing({ ...editing, side: event.target.value as Guest['side'] })}><option>男方</option><option>女方</option><option>共同</option></select></label><label><span>关系组</span><input value={editing.group} onChange={event => setEditing({ ...editing, group: event.target.value })} /></label><label><span>回执</span><select value={editing.rsvp} onChange={event => setEditing({ ...editing, rsvp: event.target.value as RsvpStatus })}><option>已确认</option><option>待回复</option><option>不出席</option></select></label><label><span>携客人数</span><input type="number" min="0" value={editing.companions} onChange={event => setEditing({ ...editing, companions: Math.max(0, Number(event.target.value)) })} /></label><label><span>儿童人数</span><input type="number" min="0" value={editing.children ?? 0} onChange={event => setEditing({ ...editing, children: Math.max(0, Number(event.target.value)) })} /></label><label><span>饮食偏好</span><input value={editing.dietary} onChange={event => setEditing({ ...editing, dietary: event.target.value })} /></label><label><span>无障碍需求</span><input value={editing.accessibilityNeed ?? ''} onChange={event => setEditing({ ...editing, accessibilityNeed: event.target.value })} placeholder="例如：轮椅、靠近出口" /></label><label><span>交通需求</span><input value={editing.transportNeed ?? ''} onChange={event => setEditing({ ...editing, transportNeed: event.target.value })} /></label><label><span>住宿需求</span><input value={editing.accommodationNeed ?? ''} onChange={event => setEditing({ ...editing, accommodationNeed: event.target.value })} /></label><fieldset className="form-wide choice-field"><legend>偏好桌位</legend>{data.tables.map(table => <label key={table.id}><input type="checkbox" checked={(editing.preferredTableIds ?? []).includes(table.id)} onChange={() => toggleConstraint('preferredTableIds', table.id)} />{table.name}</label>)}</fieldset><fieldset className="form-wide choice-field"><legend>必须同桌</legend>{data.guests.filter(guest => guest.id !== editing.id).map(guest => <label key={guest.id}><input type="checkbox" checked={(editing.mustSitWithGuestIds ?? []).includes(guest.id)} onChange={() => toggleConstraint('mustSitWithGuestIds', guest.id)} />{guest.name}</label>)}</fieldset><fieldset className="form-wide choice-field"><legend>禁止同桌</legend>{data.guests.filter(guest => guest.id !== editing.id).map(guest => <label key={guest.id}><input type="checkbox" checked={(editing.avoidGuestIds ?? []).includes(guest.id)} onChange={() => toggleConstraint('avoidGuestIds', guest.id)} />{guest.name}</label>)}</fieldset><label className="form-wide"><span>备注</span><textarea value={editing.note} onChange={event => setEditing({ ...editing, note: event.target.value })} /></label></fieldset>}
    </Modal>
  </div>;
}