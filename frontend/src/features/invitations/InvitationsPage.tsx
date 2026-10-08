import { useState } from 'react';
import { Icon } from '../../components/Icon';
import { LoadingState } from '../../components/LoadingState';
import { Modal } from '../../components/Modal';
import { PageHeader } from '../../components/PageHeader';
import { appConfig } from '../../config/appConfig';
import { copyTextToClipboard, openExternalWindow } from '../../lib/browserActions';
import { createId } from '../../lib/id';
import { createInvitationToken } from '../../services/persistence/migrations';
import { useWeddingData } from '../../state/WeddingDataProvider';
import type { Invitation, InvitationStatus, ThemeId } from '../../types/domain';

const blank = (guestId: string): Invitation => {
  const id = createId('invite');
  return {
    id,
    guestId,
    template: 'champagne',
    salutation: '亲爱的朋友',
    message: '诚邀您见证我们的婚礼，与我们共享这一程星光。',
    status: '草稿',
    sentAt: '',
    openedAt: '',
    respondedAt: '',
    token: createInvitationToken(id, guestId)
  };
};
const flow: InvitationStatus[] = ['草稿', '待发送', '已发送', '已确认'];

function publicUrl(projectId: string, token: string): string {
  const url = new URL(appConfig.publicInvitationBaseUrl, location.origin);
  url.searchParams.set('projectId', projectId);
  url.searchParams.set('token', token);
  return url.toString();
}

export function InvitationsPage() {
  const { data, loading, updateCollection, can } = useWeddingData();
  const [editing, setEditing] = useState<Invitation | null>(null);
  const [selected, setSelected] = useState('');
  const [notice, setNotice] = useState('');
  if (loading || !data) return <LoadingState />;
  const writable = can('execution.write');

  const current = data.invitations.find(item => item.id === (selected || data.invitations[0]?.id));
  const guest = current ? data.guests.find(item => item.id === current.guestId) : undefined;
  const save = () => {
    if (!editing || !writable) return;
    const normalized = { ...editing, token: editing.token || createInvitationToken(editing.id, editing.guestId) };
    updateCollection('invitations', list => list.some(item => item.id === normalized.id) ? list.map(item => item.id === normalized.id ? normalized : item) : [...list, normalized]);
    setSelected(normalized.id);
    setEditing(null);
  };
  const advance = (item: Invitation) => {
    if (!writable) return;
    const next = flow[Math.min(flow.length - 1, flow.indexOf(item.status) + 1)] ?? '已确认';
    const now = new Date().toISOString();
    updateCollection('invitations', list => list.map(invitation => invitation.id === item.id ? {
      ...invitation,
      status: next,
      sentAt: next === '已发送' && !invitation.sentAt ? now : invitation.sentAt,
      respondedAt: next === '已确认' && !invitation.respondedAt ? now : invitation.respondedAt
    } : invitation));
  };
  const copyText = async (text: string, success: string) => {
    try {
      await copyTextToClipboard(text);
      setNotice(success);
    } catch (error) {
      setNotice(error instanceof Error ? `复制失败：${error.message}` : '复制失败');
    }
  };
  const copyLink = async (item: Invitation) => {
    if (!item.token) return;
    await copyText(publicUrl(data.projectId, item.token), '专属请帖链接已复制，链接已经包含婚礼项目标识。');
  };
  const preview = (item: Invitation) => {
    if (!item.token) return;
    try { openExternalWindow(publicUrl(data.projectId, item.token)); }
    catch (error) { setNotice(error instanceof Error ? error.message : '无法打开 H5 预览'); }
  };

  return <div className="page">
    <PageHeader eyebrow="PERSONALIZED INVITATION" title="电子请帖" description="按宾客生成专属 Token、项目级公开 H5、打开追踪与赴约回执。" actions={<button className="button" disabled={!data.guests.length || !writable} onClick={() => setEditing(blank(data.guests[0]?.id ?? ''))}><Icon name="plus" />新增请帖</button>} />
    {notice && <div className="global-alert" role={notice.includes('失败') || notice.includes('阻止') ? 'alert' : 'status'}><Icon name={notice.includes('失败') || notice.includes('阻止') ? 'warning' : 'check'} /><span>{notice}</span><button onClick={() => setNotice('')}>关闭</button></div>}
    <section className="stats-grid">
      <article className="metric panel"><span>请帖总数</span><strong>{data.invitations.length}</strong><small>专属宾客版本</small></article>
      <article className="metric panel"><span>已发送</span><strong>{data.invitations.filter(item => ['已发送', '已确认'].includes(item.status)).length}</strong><small>触达进度</small></article>
      <article className="metric panel"><span>已打开</span><strong>{data.invitations.filter(item => item.openedAt).length}</strong><small>真实打开追踪</small></article>
      <article className="metric panel"><span>已确认</span><strong>{data.invitations.filter(item => item.respondedAt).length}</strong><small>回执闭环</small></article>
    </section>
    <section className="invitation-layout">
      <aside className="panel invitation-list"><header><span className="eyebrow">RECIPIENTS</span><h2>宾客请帖</h2></header>{data.invitations.map(item => {
        const boundGuest = data.guests.find(value => value.id === item.guestId);
        return <button key={item.id} className={(selected || data.invitations[0]?.id) === item.id ? 'is-active' : ''} onClick={() => setSelected(item.id)}><span><strong>{boundGuest?.name || '未绑定宾客'}</strong><small>{item.openedAt ? '已打开' : item.salutation}</small></span><em>{item.status}</em></button>;
      })}</aside>
      {current ? <>
        <article className={`invite-preview invite-preview--${current.template} panel`}><span className="invite-preview__ornament">W</span><small>THE WEDDING OF</small><h2>{data.profile.groomName}<i>＆</i>{data.profile.brideName}</h2><div className="invite-preview__line" /><strong>{current.salutation}</strong><p>{current.message}</p><dl><div><dt>DATE</dt><dd>{data.profile.weddingDate}</dd></div><div><dt>TIME</dt><dd>{data.profile.ceremonyTime}</dd></div><div><dt>VENUE</dt><dd>{data.profile.venueName}</dd></div></dl><footer>{data.profile.venueAddress}</footer></article>
        <aside className="panel invitation-detail"><header><div><span className="eyebrow">DELIVERY</span><h2>{guest?.name}</h2></div><button className="icon-button" disabled={!writable} aria-label="编辑请帖" onClick={() => setEditing(current)}><Icon name="edit" /></button></header>
          <div className="delivery-flow">{flow.map((status, index) => <div className={flow.indexOf(current.status) >= index ? 'is-done' : ''} key={status}><i>{flow.indexOf(current.status) > index ? <Icon name="check" /> : index + 1}</i><span><strong>{status}</strong><small>{index === 0 ? '完成内容编辑' : index === 1 ? '进入发送队列' : index === 2 ? current.openedAt ? `已于 ${current.openedAt.slice(0, 16)} 打开` : '等待打开' : current.respondedAt ? '回执完成' : '等待回执'}</small></span></div>)}</div>
          <button className="button button--wide" disabled={!current.token} onClick={() => void copyLink(current)}>复制公开请帖链接</button>
          {current.token && <button className="button button--ghost button--wide" onClick={() => preview(current)}>打开 H5 预览</button>}
          {current.status !== '已确认' && <button className="button button--ghost button--wide" disabled={!writable} onClick={() => advance(current)}>手动推进至 {flow[Math.min(flow.length - 1, flow.indexOf(current.status) + 1)]}</button>}
          <button className="button button--ghost button--wide" onClick={() => void copyText(`${current.salutation}\n${current.message}`, '专属请帖文案已复制。')}>复制专属文案</button>
        </aside>
      </> : <div className="panel"><p>暂无请帖</p></div>}
    </section>
    <Modal open={Boolean(editing)} title="请帖内容" onClose={() => setEditing(null)} footer={<><button className="button button--ghost" onClick={() => setEditing(null)}>取消</button>{editing && data.invitations.some(item => item.id === editing.id) && <button className="button button--danger" disabled={!writable} onClick={() => { updateCollection('invitations', list => list.filter(item => item.id !== editing.id)); setEditing(null); }}>删除</button>}<button className="button" disabled={!writable} onClick={save}>保存</button></>}>
      {editing && <div className="form-grid"><label><span>宾客</span><select disabled={!writable} value={editing.guestId} onChange={event => setEditing({ ...editing, guestId: event.target.value, token: createInvitationToken(editing.id, event.target.value) })}>{data.guests.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label><label><span>主题</span><select disabled={!writable} value={editing.template} onChange={event => setEditing({ ...editing, template: event.target.value as ThemeId })}>{['champagne', 'moonlight', 'rose', 'midnight', 'festival', 'kawaii'].map(value => <option key={value}>{value}</option>)}</select></label><label className="form-wide"><span>专属 Token</span><input value={editing.token ?? ''} readOnly /></label><label className="form-wide"><span>专属称呼</span><input disabled={!writable} value={editing.salutation} onChange={event => setEditing({ ...editing, salutation: event.target.value })} /></label><label className="form-wide"><span>专属文案</span><textarea disabled={!writable} rows={5} value={editing.message} onChange={event => setEditing({ ...editing, message: event.target.value })} /></label><label><span>状态</span><select disabled={!writable} value={editing.status} onChange={event => setEditing({ ...editing, status: event.target.value as InvitationStatus })}>{flow.map(value => <option key={value}>{value}</option>)}</select></label></div>}
    </Modal>
  </div>;
}
