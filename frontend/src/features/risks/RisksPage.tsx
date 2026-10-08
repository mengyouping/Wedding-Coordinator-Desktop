import { useState } from 'react';
import { Icon } from '../../components/Icon';
import { LoadingState } from '../../components/LoadingState';
import { Modal } from '../../components/Modal';
import { PageHeader } from '../../components/PageHeader';
import { createId } from '../../lib/id';
import { useWeddingData } from '../../state/WeddingDataProvider';
import type { RiskItem } from '../../types/domain';

const blank = (): RiskItem => ({
  id: createId('risk'), title: '', category: '综合', probability: 2, impact: 3, owner: '总指挥',
  trigger: '', responsePlan: '', status: '开放', dueDate: '', mitigationTaskIds: [], residualProbability: 1, residualImpact: 2
});

export function RisksPage() {
  const { data, loading, updateDatabase, can } = useWeddingData();
  const [editing, setEditing] = useState<RiskItem | null>(null);
  if (loading || !data) return <LoadingState />;
  const writable = can('execution.write');

  const sorted = [...data.risks].sort((first, second) => second.probability * second.impact - first.probability * first.impact);

  const save = () => {
    if (!writable || !editing?.title.trim()) return;
    const normalized: RiskItem = {
      ...editing,
      probability: Math.max(1, Math.min(5, editing.probability)),
      impact: Math.max(1, Math.min(5, editing.impact)),
      residualProbability: Math.max(1, Math.min(5, editing.residualProbability ?? editing.probability)),
      residualImpact: Math.max(1, Math.min(5, editing.residualImpact ?? editing.impact))
    };
    updateDatabase(database => ({
      ...database,
      risks: database.risks.some(risk => risk.id === normalized.id)
        ? database.risks.map(risk => risk.id === normalized.id ? normalized : risk)
        : [...database.risks, normalized],
      tasks: database.tasks.map(task => {
        const shouldLink = (normalized.mitigationTaskIds ?? []).includes(task.id);
        const current = task.relatedRiskIds ?? [];
        return { ...task, relatedRiskIds: shouldLink ? [...new Set([...current, normalized.id])] : current.filter(riskId => riskId !== normalized.id) };
      })
    }));
    setEditing(null);
  };

  const remove = (id: string) => {
    if (!writable) return;
    updateDatabase(database => ({
      ...database,
      risks: database.risks.filter(risk => risk.id !== id),
      tasks: database.tasks.map(task => ({ ...task, relatedRiskIds: (task.relatedRiskIds ?? []).filter(riskId => riskId !== id) }))
    }));
    setEditing(null);
  };

  const toggleTask = (taskId: string) => {
    if (!editing || !writable) return;
    const current = editing.mitigationTaskIds ?? [];
    setEditing({ ...editing, mitigationTaskIds: current.includes(taskId) ? current.filter(id => id !== taskId) : [...current, taskId] });
  };

  return <div className="page">
    <PageHeader eyebrow="CONTINGENCY CONTROL" title="风险预案" description="用初始风险和剩余风险双评分，关联缓解任务、触发信号、责任人与关闭期限。" actions={<button className="button" disabled={!writable} onClick={() => setEditing(blank())}><Icon name="plus" />登记风险</button>} />
    <section className="risk-layout">
      <article className="panel risk-matrix"><header><div><span className="eyebrow">RISK MATRIX</span><h2>风险热力矩阵</h2></div></header><div className="matrix"><span className="matrix-y">影响程度 →</span>{[5, 4, 3, 2, 1].map(impact => <div className="matrix-row" key={impact}>{[1, 2, 3, 4, 5].map(probability => { const items = data.risks.filter(risk => risk.impact === impact && risk.probability === probability); return <div className={`matrix-cell score-${Math.min(5, Math.ceil(probability * impact / 5))}`} key={probability}>{items.map(risk => <button key={risk.id} disabled={!writable} onClick={() => setEditing(risk)} title={risk.title}>{risk.title.slice(0, 4)}</button>)}</div>; })}</div>)}<span className="matrix-x">发生概率 →</span></div></article>
      <article className="panel risk-register"><header><div><span className="eyebrow">REGISTER</span><h2>风险登记册</h2></div><span>{data.risks.filter(risk => risk.status !== '已关闭').length} 开放</span></header>{sorted.map(risk => {
        const score = risk.probability * risk.impact;
        const residualScore = (risk.residualProbability ?? risk.probability) * (risk.residualImpact ?? risk.impact);
        return <button className="risk-row" disabled={!writable} key={risk.id} onClick={() => setEditing(risk)}><b className={score >= 12 ? 'is-high' : score >= 6 ? 'is-mid' : 'is-low'}>{score}</b><span><strong>{risk.title}</strong><small>{risk.category} · {risk.trigger}</small></span><em>剩余 {residualScore}</em><i>{risk.status}</i></button>;
      })}</article>
    </section>
    <Modal open={Boolean(editing)} title="风险登记" onClose={() => setEditing(null)} footer={<><button className="button button--ghost" onClick={() => setEditing(null)}>取消</button>{editing && data.risks.some(risk => risk.id === editing.id) && <button className="button button--danger" disabled={!writable} onClick={() => remove(editing.id)}>删除</button>}<button className="button" disabled={!writable} onClick={save}>保存</button></>}>
      {editing && <fieldset disabled={!writable} className="form-grid operations-form-fieldset"><label className="form-wide"><span>风险名称</span><input value={editing.title} onChange={event => setEditing({ ...editing, title: event.target.value })} /></label><label><span>分类</span><input value={editing.category} onChange={event => setEditing({ ...editing, category: event.target.value })} /></label><label><span>负责人</span><input value={editing.owner} onChange={event => setEditing({ ...editing, owner: event.target.value })} /></label><label><span>初始概率（1-5）</span><input type="number" min="1" max="5" value={editing.probability} onChange={event => setEditing({ ...editing, probability: Number(event.target.value) })} /></label><label><span>初始影响（1-5）</span><input type="number" min="1" max="5" value={editing.impact} onChange={event => setEditing({ ...editing, impact: Number(event.target.value) })} /></label><label><span>剩余概率（1-5）</span><input type="number" min="1" max="5" value={editing.residualProbability ?? editing.probability} onChange={event => setEditing({ ...editing, residualProbability: Number(event.target.value) })} /></label><label><span>剩余影响（1-5）</span><input type="number" min="1" max="5" value={editing.residualImpact ?? editing.impact} onChange={event => setEditing({ ...editing, residualImpact: Number(event.target.value) })} /></label><label><span>状态</span><select value={editing.status} onChange={event => setEditing({ ...editing, status: event.target.value as RiskItem['status'] })}><option>开放</option><option>处理中</option><option>已关闭</option></select></label><label><span>关闭期限</span><input type="date" value={editing.dueDate} onChange={event => setEditing({ ...editing, dueDate: event.target.value })} /></label><fieldset className="form-wide choice-field"><legend>缓解任务</legend>{data.tasks.map(task => <label key={task.id}><input type="checkbox" checked={(editing.mitigationTaskIds ?? []).includes(task.id)} onChange={() => toggleTask(task.id)} />{task.title}</label>)}</fieldset><label className="form-wide"><span>触发信号</span><textarea value={editing.trigger} onChange={event => setEditing({ ...editing, trigger: event.target.value })} /></label><label className="form-wide"><span>应对预案</span><textarea value={editing.responsePlan} onChange={event => setEditing({ ...editing, responsePlan: event.target.value })} /></label></fieldset>}
    </Modal>
  </div>;
}
