import { Icon } from '../../../components/Icon';
import { EditableOperationsTable, type OperationsColumn } from '../components/EditableOperationsTable';
import { OperationsSummary } from '../components/OperationsSummary';
import { operationsStatuses } from '../components/StatusSelect';
import type { CeremonyProgram } from '../model';
import { operationId } from '../model';

const minutes = (time: string): number => {
  const [hour = 0, minute = 0] = time.split(':').map(Number);
  return hour * 60 + minute;
};

const columns: Array<OperationsColumn<CeremonyProgram>> = [
  { key: 'time', label: '时间', type: 'time', width: 95 },
  { key: 'type', label: '环节类型', width: 100 },
  { key: 'title', label: '节目/环节', width: 180 },
  { key: 'durationMinutes', label: '时长', type: 'number', width: 80 },
  { key: 'location', label: '地点', width: 130 },
  { key: 'performer', label: '执行/表演人', width: 150 },
  { key: 'hostScript', label: '主持词/口播', type: 'textarea', width: 280 },
  { key: 'music', label: '音乐', width: 180 },
  { key: 'media', label: '视频/画面', width: 180 },
  { key: 'cue', label: '技术Cue', type: 'textarea', width: 240 },
  { key: 'owner', label: '负责人', width: 120 },
  { key: 'backup', label: '备份人', width: 120 },
  { key: 'rehearsalStatus', label: '彩排状态', width: 130 },
  { key: 'status', label: '状态', type: 'select', options: operationsStatuses, width: 110 }
];

export function CeremonyCenter({ rows, onChange }: { rows: CeremonyProgram[]; onChange(rows: CeremonyProgram[]): void }) {
  const sorted = rows.slice().sort((a, b) => a.time.localeCompare(b.time));
  const overlaps = sorted.filter((row, index) => {
    const next = sorted[index + 1];
    return next ? minutes(row.time) + row.durationMinutes > minutes(next.time) : false;
  });
  const missingMusic = rows.filter(item => ['入场', '开场', '仪式', '送客'].includes(item.type) && !item.music.trim()).length;
  const missingOwner = rows.filter(item => !item.owner.trim() || !item.backup.trim()).length;
  const pendingRehearsal = rows.filter(item => /待|未/.test(item.rehearsalStatus)).length;
  const patch = (id: string, value: Partial<CeremonyProgram>) => onChange(rows.map(item => item.id === id ? { ...item, ...value } : item));

  return <div className="operations-center">
    <OperationsSummary metrics={[
      { label: '仪式节点', value: rows.length, detail: `${rows.reduce((sum, item) => sum + item.durationMinutes, 0)} 分钟总时长`, icon: <Icon name="timeline" /> },
      { label: '时间重叠', value: overlaps.length, detail: overlaps.length ? overlaps.map(item => item.title).join('、') : '流程时间未发现重叠', tone: overlaps.length ? 'danger' : 'success', icon: <Icon name="warning" /> },
      { label: '技术资料缺口', value: missingMusic, detail: '入场、开场、仪式或送客缺少音乐', tone: missingMusic ? 'warning' : 'success', icon: <Icon name="attachments" /> },
      { label: '待彩排/人员缺口', value: pendingRehearsal + missingOwner, detail: `待彩排 ${pendingRehearsal} · 人员缺口 ${missingOwner}`, tone: pendingRehearsal + missingOwner ? 'warning' : 'success', icon: <Icon name="tasks" /> }
    ]} />

    <section className="panel operations-section"><header><div><span className="eyebrow">CEREMONY PROGRAM</span><h2>仪式节目单、主持词、音乐和技术 Cue</h2><p>流程节点不仅记录时间，还需要同时锁定主持口播、音乐、媒体画面、技术口令、负责人和备份人。</p></div></header><EditableOperationsTable
      rows={sorted}
      columns={columns}
      onPatch={patch}
      onAdd={() => onChange([...rows, { id: operationId('ceremony'), time: '18:00', type: '新增环节', title: '新增仪式节点', durationMinutes: 5, location: '主舞台', performer: '', hostScript: '', music: '', media: '', cue: '', owner: '', backup: '', rehearsalStatus: '待彩排', status: '待确认' }])}
      onDuplicate={row => onChange([...rows, { ...structuredClone(row), id: operationId('ceremony'), title: `${row.title}副本`, time: row.time }])}
      onRemove={id => window.confirm('确认删除该仪式节点吗？') && onChange(rows.filter(item => item.id !== id))}
    /></section>

    <section className="panel operations-section"><header><div><span className="eyebrow">RUN OF SHOW</span><h2>仪式时间轴与技术联排</h2></div></header><div className="ceremony-run-sheet">{sorted.map((item, index) => {
      const next = sorted[index + 1];
      const overlap = next && minutes(item.time) + item.durationMinutes > minutes(next.time);
      return <article key={item.id} className={overlap ? 'has-conflict' : ''}><time>{item.time}</time><i /><div><span>{item.type} · {item.location} · {item.durationMinutes} 分钟</span><strong>{item.title}</strong><p>{item.hostScript || '未填写主持词或执行说明'}</p><footer><b>{item.music || '未设置音乐'}</b><em>{item.cue || '未设置技术 Cue'}</em><small>{item.owner || '未指定负责人'} / 备份：{item.backup || '未指定'}</small></footer></div></article>;
    })}</div></section>
  </div>;
}
