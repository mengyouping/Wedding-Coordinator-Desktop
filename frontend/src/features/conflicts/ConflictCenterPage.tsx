import { useState } from 'react';
import { EmptyState } from '../../components/EmptyState';
import { Icon } from '../../components/Icon';
import { PageHeader } from '../../components/PageHeader';
import { requiredPermissionsForCommand } from '../../services/permissions/commandPermission';
import { useWeddingData } from '../../state/WeddingDataProvider';
import type { WeddingCommand } from '../../types/domain';

export function ConflictCenterPage() {
  const { data, outbox, conflicts, can, retryOutbox, discardOutbox, resolveConflict } = useWeddingData();
  const [workingId, setWorkingId] = useState('');
  const [notice, setNotice] = useState('');
  const pendingConflicts = conflicts.filter(item => item.status === '待处理');

  const commandAllowed = (command: WeddingCommand): boolean => Boolean(
    data && requiredPermissionsForCommand(data, command).every(permission => can(permission))
  );

  const run = async (id: string, action: () => Promise<void>, success: string) => {
    if (workingId) return;
    setWorkingId(id);
    try {
      await action();
      setNotice(success);
    } catch (error) {
      setNotice(error instanceof Error ? `操作失败：${error.message}` : '操作失败');
    } finally {
      setWorkingId('');
    }
  };

  return <div className="page conflict-page">
    <PageHeader eyebrow="SYNC & CONFLICTS" title="同步与冲突中心" description="保存失败不会覆盖本地修改。重新应用本地会先获取最新 revision，采用服务端会真实替换当前快照。" />
    {notice && <div className="global-alert" role={notice.startsWith('操作失败') ? 'alert' : 'status'}><Icon name={notice.startsWith('操作失败') ? 'warning' : 'check'} /><span>{notice}</span><button onClick={() => setNotice('')}>关闭</button></div>}

    <section className="metric-grid metric-grid--compact"><article className="panel metric-card"><span>待同步命令</span><strong>{outbox.length}</strong><small>可基于最新服务端版本重新提交</small></article><article className="panel metric-card"><span>待处理冲突</span><strong>{pendingConflicts.length}</strong><small>需要人工选择本地或服务端版本</small></article><article className="panel metric-card"><span>失败重试次数</span><strong>{outbox.reduce((sum, item) => sum + item.attempts, 0)}</strong><small>不会静默丢弃命令</small></article></section>

    <section className="panel conflict-section">
      <header><div><span className="eyebrow">OUTBOX</span><h2>待同步命令</h2></div><Icon name="database" /></header>
      {outbox.length === 0 ? <EmptyState title="没有待同步命令" description="当前本地修改已经完成同步。" /> : <div className="conflict-list">{outbox.map(item => {
        const allowed = commandAllowed(item.command);
        return <article key={item.id} className="conflict-row">
          <div><strong>{item.command.type}</strong><span>基准 Revision {item.baseRevision} · {new Date(item.createdAt).toLocaleString()}</span><small>{item.lastError || '等待同步'}</small></div>
          <span className={`status status--${item.status === '失败' ? 'danger' : 'warning'}`}>{item.status}</span>
          <div className="row-actions"><button className="button button--ghost" title={allowed ? '按最新版本重试' : '当前角色缺少该命令所需权限'} disabled={Boolean(workingId) || !allowed} onClick={() => void run(item.id, () => retryOutbox(item.id), '命令已按最新版本重新提交。')}>{workingId === item.id ? '处理中…' : '按最新版本重试'}</button><button className="button button--danger" title={allowed ? '放弃命令' : '当前角色缺少该命令所需权限'} disabled={Boolean(workingId) || !allowed} onClick={() => window.confirm('确认放弃该待同步命令吗？本地未同步修改将无法再次提交。') && void run(item.id, () => discardOutbox(item.id), '待同步命令已放弃。')}>放弃命令</button></div>
        </article>;
      })}</div>}
    </section>

    <section className="panel conflict-section">
      <header><div><span className="eyebrow">REVISION CONFLICTS</span><h2>版本冲突</h2></div><Icon name="warning" /></header>
      {conflicts.length === 0 ? <EmptyState title="没有版本冲突" description="多人协作尚未产生需要处理的 revision 冲突。" /> : <div className="conflict-list">{conflicts.map(item => {
        const allowed = commandAllowed(item.command);
        const adoptAllowed = allowed && can('project.write');
        return <article key={item.id} className="conflict-row">
          <div><strong>{item.fields.join('、') || item.command.type}</strong><span>本地 Revision {item.localRevision}{item.remoteRevision ? ` / 服务端 ${item.remoteRevision}` : ''}</span><small>{item.message}</small></div>
          <span className={`status ${item.status === '待处理' ? 'status--danger' : ''}`}>{item.status}</span>
          {item.status === '待处理' && <div className="row-actions"><button className="button button--ghost" title={allowed ? '重新应用本地命令' : '当前角色缺少该命令所需权限'} disabled={Boolean(workingId) || !allowed} onClick={() => void run(item.id, () => resolveConflict(item.id, '已重试'), '本地命令已基于最新服务端版本重新提交。')}>重新应用本地</button><button className="button button--ghost" title={adoptAllowed ? '采用服务端快照' : '采用服务端还需要项目写权限'} disabled={Boolean(workingId) || !adoptAllowed} onClick={() => window.confirm('采用服务端会用远端快照替换当前本地数据，确认继续吗？') && void run(item.id, () => resolveConflict(item.id, '采用服务端'), '已采用服务端快照。')}>采用服务端</button><button className="button button--danger" title={allowed ? '放弃本地冲突命令' : '当前角色缺少该命令所需权限'} disabled={Boolean(workingId) || !allowed} onClick={() => window.confirm('确认放弃本地冲突命令吗？') && void run(item.id, () => resolveConflict(item.id, '已放弃'), '本地冲突命令已放弃。')}>放弃本地命令</button></div>}
        </article>;
      })}</div>}
    </section>
  </div>;
}