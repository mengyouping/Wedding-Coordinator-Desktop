import { useState } from 'react';
import { EmptyState } from '../../components/EmptyState';
import { Icon } from '../../components/Icon';
import { LoadingState } from '../../components/LoadingState';
import { Modal } from '../../components/Modal';
import { PageHeader } from '../../components/PageHeader';
import { createId } from '../../lib/id';
import { useWeddingData } from '../../state/WeddingDataProvider';
import type { Priority, TaskPhase, WeddingTask } from '../../types/domain';
import { completedChecklistRate, isTaskOverdue } from '../shared/businessRules';

const phases: TaskPhase[] = ['待启动', '进行中', '待确认', '已完成'];
const blank = (): WeddingTask => ({
  id: createId('task'), title: '', description: '', owner: '总指挥', collaborators: [], phase: '待启动',
  priority: 'P1', dueDate: new Date().toISOString().slice(0, 10), category: '综合', progress: 0,
  dependencyIds: [], checklist: [], reminderAt: '', relatedRiskIds: [], budgetCategoryId: '', budgetItemId: '',
  acceptanceCriteria: '', stageCode: '', sortOrder: 0, source: 'general', parentTaskId: '', contractId: ''
});

export function TasksPage() {
  const { data, loading, updateCollection, updateDatabase, can } = useWeddingData();
  const [filter, setFilter] = useState<'全部' | Priority>('全部');
  const [editing, setEditing] = useState<WeddingTask | null>(null);
  if (loading || !data) return <LoadingState />;
  const writable = can('execution.write');

  const tasks = filter === '全部' ? data.tasks : data.tasks.filter(task => task.priority === filter);
  const overdueCount = data.tasks.filter(task => isTaskOverdue(task, undefined, data.settings.timezone)).length;

  const save = () => {
    if (!writable || !editing?.title.trim()) return;
    const normalized = { ...editing, progress: completedChecklistRate(editing), sortOrder: editing.sortOrder || data.tasks.length + 1 };
    updateCollection('tasks', list => list.some(task => task.id === normalized.id)
      ? list.map(task => task.id === normalized.id ? normalized : task)
      : [...list, normalized]);
    setEditing(null);
  };

  const move = (id: string, phase: TaskPhase) => {
    if (!writable) return;
    updateCollection('tasks', list => list.map(task => task.id === id ? {
      ...task,
      phase,
      progress: phase === '已完成' ? 100 : phase === '待确认' ? Math.max(90, task.progress) : phase === '进行中' ? Math.max(20, task.progress) : 0
    } : task));
  };

  const removeTask = (id: string) => {
    if (!writable) return;
    updateDatabase(database => ({
      ...database,
      tasks: database.tasks.filter(task => task.id !== id).map(task => ({
        ...task,
        dependencyIds: (task.dependencyIds ?? []).filter(dependencyId => dependencyId !== id),
        parentTaskId: task.parentTaskId === id ? '' : task.parentTaskId
      })),
      risks: database.risks.map(risk => ({ ...risk, mitigationTaskIds: (risk.mitigationTaskIds ?? []).filter(taskId => taskId !== id) }))
    }));
    setEditing(null);
  };

  const toggleDependency = (taskId: string) => {
    if (!editing || !writable) return;
    const current = editing.dependencyIds ?? [];
    setEditing({ ...editing, dependencyIds: current.includes(taskId) ? current.filter(id => id !== taskId) : [...current, taskId] });
  };

  const toggleRisk = (riskId: string) => {
    if (!editing || !writable) return;
    const current = editing.relatedRiskIds ?? [];
    setEditing({ ...editing, relatedRiskIds: current.includes(riskId) ? current.filter(id => id !== riskId) : [...current, riskId] });
  };

  const addChecklist = () => {
    if (!editing || !writable) return;
    setEditing({ ...editing, checklist: [...(editing.checklist ?? []), { id: createId('check'), title: '新检查项', done: false }] });
  };

  return <div className="page">
    <PageHeader eyebrow="EXECUTION BOARD" title="筹备任务" description="按阶段、依赖、检查项、提醒、风险和预算关联推进所有责任事项；预算总指挥清单与本看板共享数据。" actions={<button className="button" disabled={!writable} onClick={() => setEditing(blank())}><Icon name="plus" />新增任务</button>} />
    <section className="toolbar panel"><div className="tabs">{(['全部', 'P0', 'P1', 'P2'] as const).map(value => <button key={value} className={filter === value ? 'is-active' : ''} onClick={() => setFilter(value)}>{value}</button>)}</div><span>{data.tasks.filter(task => task.phase !== '已完成').length} 个任务待关闭 · {overdueCount} 个已逾期 · {data.tasks.filter(task => task.source === 'budget').length} 个预算清单任务</span></section>
    <section className="kanban">
      {phases.map((phase, index) => {
        const list = tasks.filter(task => task.phase === phase);
        return <article className="kanban-column panel" key={phase}><header><div><i>{index + 1}</i><strong>{phase}</strong></div><span>{list.length}</span></header><div className="kanban-list">
          {list.length === 0 ? <EmptyState title="当前阶段为空" /> : list.map(task => {
            const overdue = isTaskOverdue(task, undefined, data.settings.timezone);
            const checklist = task.checklist ?? [];
            const budgetItem = data.budget.items.find(item => item.id === task.budgetItemId);
            return <div className={`task-card interactive-card ${overdue ? 'is-overdue' : ''}`} key={task.id}>
              <div className="task-card__meta"><span className={`priority priority--${task.priority.toLowerCase()}`}>{task.priority}</span><small>{task.stageCode ? `${task.category} · ${task.stageCode}` : task.category}</small><button className="icon-button" disabled={!writable} aria-label={`编辑任务 ${task.title}`} onClick={() => setEditing(task)}><Icon name="edit" /></button></div>
              <h3>{task.title}</h3><p>{task.description || task.acceptanceCriteria || '尚未补充执行说明'}</p>
              {budgetItem && <small className="budget-source-badge is-auto">关联预算：{budgetItem.name}</small>}
              {(task.collaborators ?? []).length > 0 && <small>协同：{(task.collaborators ?? []).join('、')}</small>}
              {checklist.length > 0 && <small>{checklist.filter(item => item.done).length}/{checklist.length} 检查项完成</small>}
              <div className="progress"><i><b style={{ width: `${task.progress}%` }} /></i><span>{task.progress}%</span></div>
              <footer><span>{task.owner}</span><time>{overdue ? '已逾期 · ' : ''}{task.dueDate || task.stageCode || '未设置日期'}</time></footer>
              <div className="task-card__actions">{phases.filter(value => value !== phase).map(value => <button key={value} disabled={!writable} onClick={() => move(task.id, value)}>{value}</button>)}</div>
            </div>;
          })}
        </div></article>;
      })}
    </section>
    <Modal open={Boolean(editing)} title={editing?.title ? '编辑任务' : '新增任务'} onClose={() => setEditing(null)} footer={<><button className="button button--ghost" onClick={() => setEditing(null)}>取消</button>{editing && data.tasks.some(task => task.id === editing.id) && <button className="button button--danger" disabled={!writable} onClick={() => removeTask(editing.id)}>删除</button>}<button className="button" disabled={!writable} onClick={save}>保存</button></>}>
      {editing && <fieldset disabled={!writable} className="form-grid operations-form-fieldset"><legend>任务编辑字段</legend>
        <label className="form-wide"><span>任务名称</span><input value={editing.title} onChange={event => setEditing({ ...editing, title: event.target.value })} /></label>
        <label className="form-wide"><span>执行说明</span><textarea value={editing.description} onChange={event => setEditing({ ...editing, description: event.target.value })} /></label>
        <label><span>负责人</span><input value={editing.owner} onChange={event => setEditing({ ...editing, owner: event.target.value })} /></label>
        <label><span>协同人（顿号或逗号分隔）</span><input value={(editing.collaborators ?? []).join('、')} onChange={event => setEditing({ ...editing, collaborators: event.target.value.split(/[、,，]/).map(value => value.trim()).filter(Boolean) })} /></label>
        <label><span>分类</span><input value={editing.category} onChange={event => setEditing({ ...editing, category: event.target.value })} /></label>
        <label><span>计划节点</span><input value={editing.stageCode ?? ''} placeholder="T-30日" onChange={event => setEditing({ ...editing, stageCode: event.target.value })} /></label>
        <label><span>阶段</span><select value={editing.phase} onChange={event => setEditing({ ...editing, phase: event.target.value as TaskPhase })}>{phases.map(value => <option key={value}>{value}</option>)}</select></label>
        <label><span>优先级</span><select value={editing.priority} onChange={event => setEditing({ ...editing, priority: event.target.value as Priority })}>{['P0', 'P1', 'P2'].map(value => <option key={value}>{value}</option>)}</select></label>
        <label><span>截止日期</span><input type="date" value={editing.dueDate} onChange={event => setEditing({ ...editing, dueDate: event.target.value })} /></label>
        <label><span>提醒时间</span><input type="datetime-local" value={editing.reminderAt ?? ''} onChange={event => setEditing({ ...editing, reminderAt: event.target.value })} /></label>
        <label className="form-wide"><span>关联预算项目</span><select value={editing.budgetItemId ?? ''} onChange={event => { const item = data.budget.items.find(value => value.id === event.target.value); setEditing({ ...editing, budgetItemId: event.target.value, budgetCategoryId: item?.categoryId ?? '', source: event.target.value ? 'budget' : 'general' }); }}><option value="">不关联</option>{data.budget.items.map(item => <option key={item.id} value={item.id}>{item.category} / {item.name}</option>)}</select></label>
        <label className="form-wide"><span>验收标准</span><textarea value={editing.acceptanceCriteria ?? ''} onChange={event => setEditing({ ...editing, acceptanceCriteria: event.target.value })} /></label>
        <fieldset className="form-wide choice-field"><legend>前置依赖</legend>{data.tasks.filter(task => task.id !== editing.id).map(task => <label key={task.id}><input type="checkbox" checked={(editing.dependencyIds ?? []).includes(task.id)} onChange={() => toggleDependency(task.id)} />{task.title}</label>)}</fieldset>
        <fieldset className="form-wide choice-field"><legend>关联风险</legend>{data.risks.map(risk => <label key={risk.id}><input type="checkbox" checked={(editing.relatedRiskIds ?? []).includes(risk.id)} onChange={() => toggleRisk(risk.id)} />{risk.title}</label>)}</fieldset>
        <div className="form-wide checklist-editor"><header><span>检查清单</span><button type="button" className="button button--ghost" onClick={addChecklist}>新增检查项</button></header>{(editing.checklist ?? []).map(item => <div key={item.id}><input type="checkbox" checked={item.done} onChange={event => setEditing({ ...editing, checklist: (editing.checklist ?? []).map(current => current.id === item.id ? { ...current, done: event.target.checked } : current) })} /><input value={item.title} onChange={event => setEditing({ ...editing, checklist: (editing.checklist ?? []).map(current => current.id === item.id ? { ...current, title: event.target.value } : current) })} /><button className="icon-button" aria-label="删除检查项" onClick={() => setEditing({ ...editing, checklist: (editing.checklist ?? []).filter(current => current.id !== item.id) })}><Icon name="trash" /></button></div>)}</div>
      </fieldset>}
    </Modal>
  </div>;
}
