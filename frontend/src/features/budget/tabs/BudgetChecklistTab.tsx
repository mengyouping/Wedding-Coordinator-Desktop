import { useState } from 'react';
import { Icon } from '../../../components/Icon';
import { createId } from '../../../lib/id';
import { useWeddingData } from '../../../state/WeddingDataProvider';
import type { Priority, TaskPhase, WeddingTask } from '../../../types/domain';
import type { ResolvedBudgetWorkbook } from '../../../types/budgetWorkbook';

const phases: TaskPhase[] = ['待启动', '进行中', '待确认', '已完成'];
const priorities: Priority[] = ['P0', 'P1', 'P2'];

export function BudgetChecklistTab({ workbook }: { workbook: ResolvedBudgetWorkbook }) {
  const { data, updateDatabase, can } = useWeddingData();
  const [view, setView] = useState<'list' | 'timeline'>('list');
  if (!data) return null;
  const writable = can('execution.write');
  const tasks = data.tasks.filter(item => item.source === 'budget' || item.budgetItemId || item.budgetCategoryId).slice().sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

  const patch = (id: string, value: Partial<WeddingTask>) => updateDatabase(database => ({
    ...database,
    tasks: database.tasks.map(item => item.id === id ? { ...item, ...value } : item)
  }));

  const insert = (after?: WeddingTask, parentTaskId = '') => updateDatabase(database => {
    const ordered = database.tasks.slice().sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
    const created: WeddingTask = {
      id: createId('budget-task'),
      title: parentTaskId ? '新增子任务' : '新增总指挥任务',
      description: '',
      owner: '总指挥',
      collaborators: [],
      phase: '待启动',
      priority: 'P1',
      dueDate: '',
      category: after?.category ?? '综合',
      progress: 0,
      dependencyIds: after ? [after.id] : [],
      checklist: [],
      reminderAt: '',
      relatedRiskIds: [],
      budgetCategoryId: after?.budgetCategoryId ?? '',
      budgetItemId: after?.budgetItemId ?? '',
      contractId: after?.contractId ?? '',
      acceptanceCriteria: '',
      stageCode: after?.stageCode ?? '',
      sortOrder: after ? (after.sortOrder ?? 0) + 0.5 : ordered.length + 1,
      source: 'budget',
      parentTaskId
    };
    const tasks = [...database.tasks, created].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)).map((item, index) => ({ ...item, sortOrder: index + 1 }));
    return { ...database, tasks };
  });

  const remove = (id: string) => updateDatabase(database => ({
    ...database,
    tasks: database.tasks.filter(item => item.id !== id).map(item => ({
      ...item,
      dependencyIds: (item.dependencyIds ?? []).filter(value => value !== id),
      parentTaskId: item.parentTaskId === id ? '' : item.parentTaskId
    })),
    risks: database.risks.map(item => ({ ...item, mitigationTaskIds: (item.mitigationTaskIds ?? []).filter(value => value !== id) }))
  }));

  const completed = tasks.filter(item => item.phase === '已完成').length;
  const stages = [...new Set(tasks.map(item => item.stageCode || '未分阶段'))];

  return <div className="budget-tab-content budget-checklist-tab">
    <section className="budget-control-grid budget-checklist-stats">
      <article className="panel budget-control-card"><span>总指挥清单</span><strong>{tasks.length}</strong><small>与筹备任务共用数据</small></article>
      <article className="panel budget-control-card"><span>已完成</span><strong>{completed}</strong><small>{tasks.length ? Math.round(completed / tasks.length * 100) : 0}% 完成率</small></article>
      <article className="panel budget-control-card"><span>P0 关键项</span><strong>{tasks.filter(item => item.priority === 'P0' && item.phase !== '已完成').length}</strong><small>需要总指挥重点盯办</small></article>
      <article className="panel budget-control-card"><span>未设置负责人</span><strong>{tasks.filter(item => !item.owner.trim()).length}</strong><small>建议立即补齐责任人</small></article>
    </section>

    <section className="panel budget-checklist-workbook">
      <header className="budget-detail-toolbar"><div><span className="eyebrow">COMMANDER CHECKLIST</span><h2>预算总指挥清单</h2><p>任务与原“筹备任务”看板共享同一数据；可在任意行下方插入，或增加子任务。</p></div><div className="budget-detail-toolbar__actions"><div className="tabs"><button className={view === 'list' ? 'is-active' : ''} onClick={() => setView('list')}>清单视图</button><button className={view === 'timeline' ? 'is-active' : ''} onClick={() => setView('timeline')}>时间轴视图</button></div>{writable && <button className="button" onClick={() => insert()}><Icon name="plus" />新增任务</button>}</div></header>

      {view === 'list' && <div className="table-scroll"><table className="data-table budget-checklist-table">
        <thead><tr><th>阶段</th><th>最晚节点</th><th>任务</th><th>关联预算项目</th><th>主负责人</th><th>协同人</th><th>验收标准</th><th>状态</th><th>进度</th><th>优先级</th><th /></tr></thead>
        <tbody>{tasks.map(task => <tr key={task.id} className={task.parentTaskId ? 'is-child-row' : ''}>
          <td className="budget-cell--manual"><input disabled={!writable} value={task.category} onChange={event => patch(task.id, { category: event.target.value })} /></td>
          <td className="budget-cell--manual"><input disabled={!writable} value={task.stageCode ?? ''} onChange={event => patch(task.id, { stageCode: event.target.value })} placeholder="T-30日" /></td>
          <td className="budget-cell--manual"><input disabled={!writable} value={task.title} onChange={event => patch(task.id, { title: event.target.value })} /></td>
          <td className="budget-cell--manual"><select disabled={!writable} value={task.budgetItemId ?? ''} onChange={event => {
            const item = workbook.items.find(value => value.id === event.target.value);
            patch(task.id, { budgetItemId: event.target.value, budgetCategoryId: item?.categoryId ?? '' });
          }}><option value="">未关联</option>{workbook.items.map(item => <option key={item.id} value={item.id}>{item.category} / {item.name}</option>)}</select></td>
          <td className="budget-cell--manual"><input disabled={!writable} value={task.owner} onChange={event => patch(task.id, { owner: event.target.value })} /></td>
          <td className="budget-cell--manual"><input disabled={!writable} value={(task.collaborators ?? []).join('、')} onChange={event => patch(task.id, { collaborators: event.target.value.split(/[、,，]/).map(value => value.trim()).filter(Boolean) })} /></td>
          <td className="budget-cell--manual"><textarea disabled={!writable} value={task.acceptanceCriteria ?? ''} onChange={event => patch(task.id, { acceptanceCriteria: event.target.value })} /></td>
          <td><select disabled={!writable} value={task.phase} onChange={event => patch(task.id, { phase: event.target.value as TaskPhase, progress: event.target.value === '已完成' ? 100 : task.progress })}>{phases.map(value => <option key={value}>{value}</option>)}</select></td>
          <td className="budget-cell--manual"><input type="number" min="0" max="100" disabled={!writable} value={task.progress} onChange={event => patch(task.id, { progress: Math.min(100, Math.max(0, Number(event.target.value))) })} /></td>
          <td><select disabled={!writable} value={task.priority} onChange={event => patch(task.id, { priority: event.target.value as Priority })}>{priorities.map(value => <option key={value}>{value}</option>)}</select></td>
          <td><div className="budget-row-actions"><button className="icon-button" disabled={!writable} title="在下方插入" onClick={() => insert(task)}><Icon name="plus" /></button><button className="icon-button" disabled={!writable} title="增加子任务" onClick={() => insert(task, task.id)}><Icon name="tasks" /></button><button className="icon-button icon-button--danger" disabled={!writable} title="删除" onClick={() => remove(task.id)}><Icon name="trash" /></button></div></td>
        </tr>)}</tbody>
      </table></div>}

      {view === 'timeline' && <div className="budget-checklist-timeline">{stages.map(stage => <section key={stage}><header><strong>{stage}</strong><span>{tasks.filter(item => (item.stageCode || '未分阶段') === stage).length} 项</span></header><div>{tasks.filter(item => (item.stageCode || '未分阶段') === stage).map(task => <article className={`panel ${task.phase === '已完成' ? 'is-complete' : ''}`} key={task.id}><i>{task.progress}%</i><div><span>{task.category} · {task.priority}</span><strong>{task.title}</strong><p>{task.acceptanceCriteria || task.description || '尚未设置验收标准'}</p><footer><b>{task.owner || '未设置负责人'}</b><small>{(task.collaborators ?? []).join('、') || '无协同人'}</small></footer></div></article>)}</div></section>)}</div>}
    </section>
  </div>;
}
