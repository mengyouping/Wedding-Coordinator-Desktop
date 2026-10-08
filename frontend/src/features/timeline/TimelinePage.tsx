import { useState } from 'react';
import { Icon } from '../../components/Icon';
import { LoadingState } from '../../components/LoadingState';
import { Modal } from '../../components/Modal';
import { PageHeader } from '../../components/PageHeader';
import { createId } from '../../lib/id';
import { useWeddingData } from '../../state/WeddingDataProvider';
import type { TimelineItem, TimelineStatus } from '../../types/domain';
import { detectTimelineConflicts } from '../shared/businessRules';

const blank = (): TimelineItem => ({
  id: createId('timeline'), time: '12:00', title: '', owner: '总指挥', location: '主会场',
  durationMinutes: 30, status: '待确认', dependency: '', note: '', track: '主流程', dependencyIds: [], cue: '', music: ''
});

export function TimelinePage() {
  const { data, loading, updateCollection, updateDatabase, can } = useWeddingData();
  const [editing, setEditing] = useState<TimelineItem | null>(null);
  if (loading || !data) return <LoadingState />;
  const writable = can('execution.write');

  const sorted = [...data.timeline].sort((first, second) => first.time.localeCompare(second.time));
  const conflicts = detectTimelineConflicts(sorted);
  const conflictMap = new Map<string, string[]>();
  for (const conflict of conflicts) {
    conflictMap.set(conflict.firstId, [...(conflictMap.get(conflict.firstId) ?? []), conflict.reason]);
    conflictMap.set(conflict.secondId, [...(conflictMap.get(conflict.secondId) ?? []), conflict.reason]);
  }
  const tracks = [...new Set(sorted.map(item => item.track || '主流程'))];

  const save = () => {
    if (!writable || !editing?.title.trim()) return;
    updateCollection('timeline', list => list.some(item => item.id === editing.id) ? list.map(item => item.id === editing.id ? editing : item) : [...list, editing]);
    setEditing(null);
  };

  const remove = (id: string) => {
    if (!writable) return;
    updateDatabase(database => ({
      ...database,
      timeline: database.timeline.filter(item => item.id !== id).map(item => ({
        ...item,
        dependencyIds: (item.dependencyIds ?? []).filter(dependencyId => dependencyId !== id)
      })),
      runbookEvents: database.runbookEvents.filter(item => item.timelineItemId !== id)
    }));
    setEditing(null);
  };

  const toggleDependency = (id: string) => {
    if (!editing || !writable) return;
    const current = editing.dependencyIds ?? [];
    setEditing({ ...editing, dependencyIds: current.includes(id) ? current.filter(value => value !== id) : [...current, id] });
  };

  return <div className="page">
    <PageHeader eyebrow="RUN OF SHOW" title="婚礼日流程" description="按并行轨道、地点和负责人编排，检测资源冲突并维护 Cue、音乐和依赖。" actions={<button className="button" disabled={!writable} onClick={() => setEditing(blank())}><Icon name="plus" />新增节点</button>} />
    <section className="timeline-board panel">
      <header><div><span className="eyebrow">DAY ZERO TIMELINE</span><h2>{data.profile.weddingDate} · {tracks.length} 条执行轨道</h2></div><span className={conflicts.length ? 'danger-text' : 'success-text'}>{conflicts.length ? `${conflicts.length} 组资源冲突` : '未发现资源冲突'}</span></header>
      <div className="timeline-track-filter">{tracks.map(track => <span key={track}>{track}</span>)}</div>
      <div className="timeline-list">{sorted.map(item => {
        const reasons = [...new Set(conflictMap.get(item.id) ?? [])];
        return <article className={reasons.length ? 'has-conflict' : ''} key={item.id}>
          <div className="timeline-time"><strong>{item.time}</strong><small>{item.durationMinutes} min</small></div><i />
          <div className="timeline-content"><span>{item.track || '主流程'} · {item.location}</span><h3>{item.title}</h3><p>{item.note || '暂无执行说明'}</p><footer><b>{item.owner}</b><em>{item.status}</em>{item.cue && <small>Cue：{item.cue}</small>}{item.music && <small>音乐：{item.music}</small>}{reasons.length > 0 && <small className="danger-text">{reasons.join(' / ')}</small>}</footer></div>
          <button className="icon-button" disabled={!writable} aria-label={`编辑流程 ${item.title}`} onClick={() => setEditing(item)}><Icon name="edit" /></button>
        </article>;
      })}</div>
    </section>
    <Modal open={Boolean(editing)} title="流程节点" onClose={() => setEditing(null)} footer={<><button className="button button--ghost" onClick={() => setEditing(null)}>取消</button>{editing && data.timeline.some(item => item.id === editing.id) && <button className="button button--danger" disabled={!writable} onClick={() => remove(editing.id)}>删除</button>}<button className="button" disabled={!writable} onClick={save}>保存</button></>}>
      {editing && <fieldset disabled={!writable} className="form-grid operations-form-fieldset">
        <label><span>时间</span><input type="time" value={editing.time} onChange={event => setEditing({ ...editing, time: event.target.value })} /></label>
        <label><span>时长（分钟）</span><input type="number" min="1" value={editing.durationMinutes} onChange={event => setEditing({ ...editing, durationMinutes: Math.max(1, Number(event.target.value)) })} /></label>
        <label className="form-wide"><span>节点名称</span><input value={editing.title} onChange={event => setEditing({ ...editing, title: event.target.value })} /></label>
        <label><span>执行轨道</span><input value={editing.track ?? ''} onChange={event => setEditing({ ...editing, track: event.target.value })} /></label>
        <label><span>负责人</span><input value={editing.owner} onChange={event => setEditing({ ...editing, owner: event.target.value })} /></label>
        <label><span>地点</span><input value={editing.location} onChange={event => setEditing({ ...editing, location: event.target.value })} /></label>
        <label><span>状态</span><select value={editing.status} onChange={event => setEditing({ ...editing, status: event.target.value as TimelineStatus })}><option>待确认</option><option>已确认</option><option>已完成</option></select></label>
        <label><span>Cue 口令</span><input value={editing.cue ?? ''} onChange={event => setEditing({ ...editing, cue: event.target.value })} /></label>
        <label><span>音乐 / 媒体</span><input value={editing.music ?? ''} onChange={event => setEditing({ ...editing, music: event.target.value })} /></label>
        <label className="form-wide"><span>前置条件说明</span><input value={editing.dependency} onChange={event => setEditing({ ...editing, dependency: event.target.value })} /></label>
        <fieldset className="form-wide choice-field"><legend>依赖节点</legend>{data.timeline.filter(item => item.id !== editing.id).map(item => <label key={item.id}><input type="checkbox" checked={(editing.dependencyIds ?? []).includes(item.id)} onChange={() => toggleDependency(item.id)} />{item.time} {item.title}</label>)}</fieldset>
        <label className="form-wide"><span>执行说明</span><textarea value={editing.note} onChange={event => setEditing({ ...editing, note: event.target.value })} /></label>
      </fieldset>}
    </Modal>
  </div>;
}
