import { useState } from 'react';
import { Icon } from '../../components/Icon';
import { PageHeader } from '../../components/PageHeader';
import { getActiveProjectId } from '../../services/projects/projectCatalog';
import { operationsStorageKey, type WeddingTemplateId } from '../operations/model';
import { storePendingOperationsTemplate } from '../operations/pendingTemplate';
import { weddingTemplatePacks } from '../operations/templatePacks';
import { useWeddingData } from '../../state/WeddingDataProvider';

export function ProjectCenterPage() {
  const {
    projects, activeProjectId, data, can, switchProject, createProject, cloneProject,
    archiveCurrentProject, deleteProject
  } = useWeddingData();
  const [name, setName] = useState('');
  const [templateId, setTemplateId] = useState<WeddingTemplateId>('western-hotel');
  const [notice, setNotice] = useState('');
  const [workingAction, setWorkingAction] = useState('');
  const working = Boolean(workingAction);

  const create = async () => {
    if (!name.trim() || working) return;
    const previousProjectId = activeProjectId;
    setWorkingAction('create');
    try {
      await createProject(name);
      const createdProjectId = getActiveProjectId();
      if (!createdProjectId || createdProjectId === previousProjectId) {
        throw new Error('项目已经发起创建，但未成功切换到新项目，请检查全局错误提示后重试。');
      }
      storePendingOperationsTemplate(localStorage, createdProjectId, templateId);
      setName('');
      setNotice(`新婚礼项目已经创建；首次进入“婚礼全案”将应用“${weddingTemplatePacks.find(item => item.id === templateId)?.name}”。`);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : '创建失败');
    } finally {
      setWorkingAction('');
    }
  };

  const clone = async () => {
    if (!name.trim() || !data || working) return;
    const sourceProjectId = data.projectId;
    const sourceDraft = localStorage.getItem(operationsStorageKey(sourceProjectId));
    setWorkingAction('clone');
    try {
      await cloneProject(name);
      const createdProjectId = getActiveProjectId();
      if (!createdProjectId || createdProjectId === sourceProjectId) {
        throw new Error('项目副本已经发起创建，但未成功切换到副本，请检查全局错误提示后重试。');
      }
      if (sourceDraft) {
        try {
          const parsed = JSON.parse(sourceDraft) as Record<string, unknown>;
          localStorage.setItem(operationsStorageKey(createdProjectId), JSON.stringify({ ...parsed, updatedAt: new Date().toISOString() }));
        } catch {
          localStorage.removeItem(operationsStorageKey(createdProjectId));
          storePendingOperationsTemplate(localStorage, createdProjectId, templateId);
        }
      } else {
        storePendingOperationsTemplate(localStorage, createdProjectId, templateId);
      }
      setName('');
      setNotice(sourceDraft ? '项目副本及婚礼全案草案已经复制。' : '项目副本已经创建；婚礼全案将在首次进入时应用所选模板。');
    } catch (error) {
      setNotice(error instanceof Error ? error.message : '复制失败');
    } finally {
      setWorkingAction('');
    }
  };

  const switchTo = async (projectId: string) => {
    if (working || projectId === activeProjectId) return;
    setWorkingAction(`switch:${projectId}`);
    try {
      await switchProject(projectId);
      if (getActiveProjectId() !== projectId) {
        throw new Error('目标项目未完成加载，请检查全局错误提示。');
      }
      setNotice('婚礼项目切换完成。');
    } catch (error) {
      setNotice(error instanceof Error ? `切换失败：${error.message}` : '切换失败');
    } finally {
      setWorkingAction('');
    }
  };

  const remove = async (projectId: string) => {
    if (working || !window.confirm('确认删除该婚礼项目吗？主项目数据、附件和该项目的婚礼全案前端草案都会被移除。')) return;
    setWorkingAction(`delete:${projectId}`);
    try {
      await deleteProject(projectId);
      if (getActiveProjectId() === projectId) {
        throw new Error('项目删除后仍处于激活状态，请检查全局错误提示。');
      }
      localStorage.removeItem(operationsStorageKey(projectId));
      setNotice('婚礼项目及对应婚礼全案草案已经删除。');
    } catch (error) {
      setNotice(error instanceof Error ? error.message : '删除失败');
    } finally {
      setWorkingAction('');
    }
  };

  return <div className="page project-center-page">
    <PageHeader
      eyebrow="PROJECT PORTFOLIO"
      title="婚礼项目中心"
      description="创建、复制、切换、归档和删除多个婚礼项目。每个项目拥有独立主数据、备份、revision 和婚礼全案前端草案。"
    />
    {notice && <div className="global-alert" role={/失败|无权|拒绝|未成功|未完成|仍处于/.test(notice) ? 'alert' : 'status'}><Icon name={/失败|无权|拒绝|未成功|未完成|仍处于/.test(notice) ? 'warning' : 'check'} /><span>{notice}</span><button onClick={() => setNotice('')}>关闭</button></div>}

    <section className="panel project-create-card operations-project-create">
      <div><span className="eyebrow">NEW PROJECT</span><h2>创建或复制婚礼项目</h2><p>先选择婚礼类型模板，再创建项目。模板只初始化“婚礼全案”前端草案，预算、宾客和合同仍按原有项目流程维护。</p></div>
      <div className="project-template-picker" role="radiogroup" aria-label="婚礼类型模板">{weddingTemplatePacks.map(item => <button key={item.id} disabled={working} className={templateId === item.id ? 'is-active' : ''} role="radio" aria-checked={templateId === item.id} onClick={() => setTemplateId(item.id)}><i>{item.shortName.slice(0, 1)}</i><span><strong>{item.shortName}</strong><small>{item.scenes.slice(0, 2).join(' · ')}</small></span></button>)}</div>
      <div className="project-create-actions"><input disabled={working} value={name} onChange={event => setName(event.target.value)} placeholder="例如：孟先生与林小姐婚礼" /><button className="button" disabled={!can('project.write') || working || !name.trim()} onClick={() => void create()}><Icon name="plus" />{workingAction === 'create' ? '正在创建…' : '按模板创建项目'}</button><button className="button button--ghost" disabled={!data || !can('project.write') || working || !name.trim()} onClick={() => void clone()}><Icon name="copy" />{workingAction === 'clone' ? '正在复制…' : '复制当前项目'}</button></div>
    </section>

    <section className="project-card-grid">
      {projects.map(project => <article key={project.projectId} className={`panel project-card ${project.projectId === activeProjectId ? 'is-active' : ''}`}>
        <header><div><span className="eyebrow">{project.status}</span><h2>{project.projectName}</h2></div>{project.projectId === activeProjectId && <span className="status status--success">当前项目</span>}</header>
        <div className="project-couple"><strong>{project.groomName}</strong><i>＆</i><strong>{project.brideName}</strong></div>
        <dl><div><dt>婚礼日期</dt><dd>{project.weddingDate || '待设置'}</dd></div><div><dt>Revision</dt><dd>{project.revision}</dd></div><div><dt>最近打开</dt><dd>{new Date(project.lastOpenedAt).toLocaleString()}</dd></div></dl>
        <footer>
          <button className="button button--ghost" disabled={project.projectId === activeProjectId || working} onClick={() => void switchTo(project.projectId)}>{workingAction === `switch:${project.projectId}` ? '切换中…' : '切换项目'}</button>
          {project.projectId === activeProjectId && <button className="button button--ghost" disabled={!can('project.write') || working} onClick={() => archiveCurrentProject(!project.archived)}>{project.archived ? '恢复项目' : '归档项目'}</button>}
          <button className="button button--danger" disabled={!can('project.delete') || working || project.projectId === activeProjectId && projects.length === 1} onClick={() => void remove(project.projectId)}>{workingAction === `delete:${project.projectId}` ? '删除中…' : '删除'}</button>
        </footer>
      </article>)}
    </section>
  </div>;
}