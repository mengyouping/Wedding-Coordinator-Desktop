import { useEffect, useState } from 'react';
import { Icon } from '../../components/Icon';
import { LoadingState } from '../../components/LoadingState';
import { PageHeader } from '../../components/PageHeader';
import { zonedDateTimeToEpoch } from '../../lib/zonedDateTime';
import { useWeddingData } from '../../state/WeddingDataProvider';
import type { CheckInRecord, IncidentRecord, RiskLevel, RunbookEvent, TimelineStatus } from '../../types/domain';
import { createIncident, currentRunbookState, delayTimeline } from './runbookEngine';

function localClock(timeZone: string, now: Date): string {
  return new Intl.DateTimeFormat('zh-CN', { timeZone, hour: '2-digit', minute: '2-digit', hour12: false }).format(now);
}

function countdown(date: string, ceremonyTime: string, timeZone: string, now: Date): string {
  const target = zonedDateTimeToEpoch(date, ceremonyTime || '00:00', timeZone);
  const difference = target - now.getTime();
  if (!Number.isFinite(target)) return '待设置婚礼时间';
  if (difference <= 0) return '婚礼日正在进行';
  const days = Math.floor(difference / 86_400_000);
  const hours = Math.floor(difference % 86_400_000 / 3_600_000);
  const minutes = Math.floor(difference % 3_600_000 / 60_000);
  return `${days} 天 ${hours} 小时 ${minutes} 分钟`;
}

export function WarRoomPage() {
  const { data, loading, updateDatabase, can, outbox } = useWeddingData();
  const [now, setNow] = useState(new Date());
  const [delayMinutes, setDelayMinutes] = useState(10);
  const [incidentTitle, setIncidentTitle] = useState('');
  const [incidentDescription, setIncidentDescription] = useState('');
  const [incidentLevel, setIncidentLevel] = useState<RiskLevel>('中');
  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(timer);
  }, []);
  if (loading || !data) return <LoadingState />;

  const clock = localClock(data.settings.timezone, now);
  const state = currentRunbookState(data.timeline, clock);
  const writable = can('execution.write');
  const nextItems = [...data.timeline].filter(item => item.status !== '已完成').sort((a, b) => a.time.localeCompare(b.time)).slice(0, 6);

  const recordAction = (timelineItemId: string, action: RunbookEvent['action'], status?: TimelineStatus) => {
    if (!writable) return;
    updateDatabase(database => ({
      ...database,
      timeline: database.timeline.map(item => item.id === timelineItemId ? {
        ...item,
        status: status ?? item.status,
        actualStartAt: action === '开始' ? new Date().toISOString() : item.actualStartAt,
        actualEndAt: action === '完成' || action === '跳过' ? new Date().toISOString() : item.actualEndAt
      } : item),
      runbookEvents: [...database.runbookEvents, {
        id: crypto.randomUUID(), timelineItemId, action, operatorName: database.profile.coordinatorName,
        createdAt: new Date().toISOString(), note: ''
      }]
    }));
  };

  const delayCurrent = () => {
    if (!state.current || !writable) return;
    const minutes = Math.max(1, Math.min(120, delayMinutes));
    updateDatabase(database => ({
      ...database,
      timeline: delayTimeline(database.timeline, state.current!.id, minutes),
      runbookEvents: [...database.runbookEvents, {
        id: crypto.randomUUID(), timelineItemId: state.current!.id, action: '延迟', minutes,
        operatorName: database.profile.coordinatorName, createdAt: new Date().toISOString(), note: '现场作战中心顺延'
      }]
    }));
  };

  const toggleCheckIn = (targetType: CheckInRecord['targetType'], targetId: string, targetName: string) => {
    if (!writable) return;
    updateDatabase(database => {
      const existing = database.checkIns.find(item => item.targetType === targetType && item.targetId === targetId);
      const status: CheckInRecord['status'] = existing?.status === '已到场' ? '已离场' : '已到场';
      const record: CheckInRecord = {
        id: existing?.id ?? crypto.randomUUID(), targetType, targetId, targetName, status,
        checkedAt: new Date().toISOString(), operatorName: database.profile.coordinatorName
      };
      return { ...database, checkIns: existing ? database.checkIns.map(item => item.id === existing.id ? record : item) : [...database.checkIns, record] };
    });
  };

  const submitIncident = () => {
    if (!incidentTitle.trim() || !writable) return;
    const incident: IncidentRecord = createIncident({ title: incidentTitle, level: incidentLevel, owner: data.profile.coordinatorName, description: incidentDescription });
    updateDatabase(database => ({ ...database, incidents: [...database.incidents, incident] }));
    setIncidentTitle('');
    setIncidentDescription('');
  };

  const checked = (type: CheckInRecord['targetType'], id: string) => data.checkIns.find(item => item.targetType === type && item.targetId === id)?.status === '已到场';

  return <div className="page warroom-page">
    <PageHeader eyebrow="WEDDING DAY WAR ROOM" title="婚礼日作战中心" description="为婚礼当天准备的大按钮、低干扰、离线优先实时指挥界面。" />

    <section className="warroom-hero panel"><div><span className="eyebrow">CURRENT TIME</span><strong className="warroom-clock">{clock}</strong><p>{data.profile.weddingDate} · {data.profile.venueName}</p></div><div><span className="eyebrow">COUNTDOWN</span><strong>{countdown(data.profile.weddingDate, data.profile.ceremonyTime, data.settings.timezone, now)}</strong><p>{outbox.length ? `${outbox.length} 条现场操作等待同步` : '现场数据已同步'}</p></div><div><span className="eyebrow">PROGRESS</span><strong>{state.completed}/{data.timeline.length}</strong><p>剩余 {state.remaining} 个流程节点</p></div></section>

    <section className="warroom-grid">
      <article className="panel warroom-current"><header><div><span className="eyebrow">NOW RUNNING</span><h2>当前执行</h2></div><Icon name="warroom" /></header>
        {state.current ? <><time>{state.current.time}</time><h1>{state.current.title}</h1><p>{state.current.owner} · {state.current.location}</p><small>{state.current.cue || state.current.note || '请按现场情况推进。'}</small><div className="warroom-actions"><button disabled={!writable} onClick={() => recordAction(state.current!.id, '开始', '已确认')}>开始</button><button disabled={!writable} onClick={() => recordAction(state.current!.id, '完成', '已完成')}>完成</button><button disabled={!writable} onClick={() => recordAction(state.current!.id, '跳过', '已完成')}>跳过</button></div><div className="delay-control"><input disabled={!writable} type="number" min="1" max="120" value={delayMinutes} onChange={event => setDelayMinutes(Math.max(1, Math.min(120, Number(event.target.value))))} /><button className="button button--ghost" disabled={!writable} onClick={delayCurrent}>顺延后续节点</button></div></> : <p>当前没有正在执行的流程节点。</p>}
      </article>
      <article className="panel warroom-next"><header><div><span className="eyebrow">UP NEXT</span><h2>下一节点</h2></div><Icon name="timeline" /></header>{state.next ? <><time>{state.next.time}</time><h2>{state.next.title}</h2><p>{state.next.owner} · {state.next.location}</p></> : <p>暂无后续节点。</p>}<div className="runbook-list">{nextItems.map(item => <div key={item.id}><time>{item.time}</time><span>{item.title}</span><small>{item.status}</small></div>)}</div></article>
    </section>

    <section className="warroom-grid warroom-grid--three">
      <article className="panel checkin-card"><header><h2>团队签到</h2><Icon name="guests" /></header>{data.members.filter(item => item.active).map(member => <button disabled={!writable} key={member.id} className={checked('负责人', member.id) ? 'is-checked' : ''} onClick={() => toggleCheckIn('负责人', member.id, member.name)}><span>{member.name}</span><small>{checked('负责人', member.id) ? '已到场' : '未签到'}</small></button>)}</article>
      <article className="panel checkin-card"><header><h2>供应商签到</h2><Icon name="vendors" /></header>{data.vendors.map(vendor => <button disabled={!writable} key={vendor.id} className={checked('供应商', vendor.id) ? 'is-checked' : ''} onClick={() => toggleCheckIn('供应商', vendor.id, vendor.name)}><span>{vendor.name}</span><small>{checked('供应商', vendor.id) ? '已到场' : '未签到'}</small></button>)}</article>
      <article className="panel checkin-card"><header><h2>关键物料到场</h2><Icon name="materials" /></header>{data.materials.slice(0, 8).map(material => <button disabled={!writable} key={material.id} className={checked('物料', material.id) ? 'is-checked' : ''} onClick={() => toggleCheckIn('物料', material.id, material.name)}><span>{material.name}</span><small>{checked('物料', material.id) ? '已到场' : material.transportStatus ?? '未装箱'}</small></button>)}</article>
    </section>

    <section className="warroom-grid">
      <article className="panel incident-form"><header><div><span className="eyebrow">INCIDENT</span><h2>现场异常上报</h2></div><Icon name="warning" /></header><div className="form-grid"><label className="form-wide"><span>异常标题</span><input disabled={!writable} value={incidentTitle} onChange={event => setIncidentTitle(event.target.value)} placeholder="例如：摄影 B 机位晚到" /></label><label><span>等级</span><select disabled={!writable} value={incidentLevel} onChange={event => setIncidentLevel(event.target.value as RiskLevel)}><option>低</option><option>中</option><option>高</option></select></label><label className="form-wide"><span>现场说明</span><textarea disabled={!writable} value={incidentDescription} onChange={event => setIncidentDescription(event.target.value)} /></label></div><button className="button button--danger" disabled={!writable || !incidentTitle.trim()} onClick={submitIncident}>上报异常</button></article>
      <article className="panel incident-list"><header><div><span className="eyebrow">LIVE ISSUES</span><h2>处理中异常</h2></div><strong>{data.incidents.filter(item => item.status === '处理中').length}</strong></header>{data.incidents.length ? data.incidents.slice().reverse().map(item => <div key={item.id}><span className={`priority priority--${item.level === '高' ? 'p0' : item.level === '中' ? 'p1' : 'p2'}`}>{item.level}</span><div><strong>{item.title}</strong><small>{item.owner} · {new Date(item.createdAt).toLocaleTimeString()}</small></div><button disabled={!writable || item.status === '已解决'} onClick={() => updateDatabase(database => ({ ...database, incidents: database.incidents.map(current => current.id === item.id ? { ...current, status: '已解决', resolvedAt: new Date().toISOString() } : current) }))}>{item.status === '已解决' ? '已解决' : '标记解决'}</button></div>) : <p>暂无现场异常。</p>}</article>
    </section>
  </div>;
}
