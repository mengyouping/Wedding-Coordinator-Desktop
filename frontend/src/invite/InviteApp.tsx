import { useEffect, useMemo, useState } from 'react';
import { appConfig } from '../config/appConfig';
import { publicInvitationApi, type PublicInvitationView, type PublicRsvpRequest } from '../services/api/publicInvitationApi';
import { loadJsonSnapshot, saveJsonSnapshot } from '../services/persistence/jsonFileStore';
import { getActiveProjectId } from '../services/projects/projectCatalog';
import type { WeddingDatabase } from '../types/domain';

function getToken(): string {
  return new URLSearchParams(location.search).get('token')?.trim() ?? '';
}

function getProjectId(): string {
  return new URLSearchParams(location.search).get('projectId')?.trim() || getActiveProjectId();
}

async function readLocalDatabase(projectId: string): Promise<WeddingDatabase> {
  return loadJsonSnapshot(projectId);
}

function toPublicView(database: WeddingDatabase, token: string): PublicInvitationView {
  const invitation = database.invitations.find(item => item.token === token);
  if (!invitation) throw new Error('请帖不存在或链接已失效');
  const guest = database.guests.find(item => item.id === invitation.guestId);
  if (!guest) throw new Error('请帖未绑定有效宾客');
  return {
    profile: database.profile,
    guest: { id: guest.id, name: guest.name, companions: guest.companions, dietary: guest.dietary, rsvp: guest.rsvp },
    invitation: {
      id: invitation.id,
      template: invitation.template,
      salutation: invitation.salutation,
      message: invitation.message,
      status: invitation.status,
      openedAt: invitation.openedAt,
      respondedAt: invitation.respondedAt
    }
  };
}

async function writeLocalResponse(projectId: string, token: string, request?: PublicRsvpRequest): Promise<PublicInvitationView> {
  const database = await readLocalDatabase(projectId);
  const invitation = database.invitations.find(item => item.token === token);
  if (!invitation) throw new Error('请帖不存在或链接已失效');
  const now = new Date().toISOString();
  invitation.openedAt ||= now;
  if (request) {
    invitation.respondedAt = now;
    invitation.status = '已确认';
    const guest = database.guests.find(item => item.id === invitation.guestId);
    if (guest) {
      guest.rsvp = request.attending ? '已确认' : '不出席';
      guest.companions = request.attending ? Math.max(0, request.companions) : 0;
      guest.dietary = request.dietary;
      guest.note = [guest.note, request.note].filter(Boolean).join('；');
    }
  }
  const saved = await saveJsonSnapshot({
    ...database,
    revision: database.revision + 1,
    updatedAt: now
  });
  return toPublicView(saved, token);
}

async function loadInvitation(projectId: string, token: string): Promise<PublicInvitationView> {
  if (appConfig.dataMode === 'json') {
    const current = toPublicView(await readLocalDatabase(projectId), token);
    return current.invitation.openedAt ? current : writeLocalResponse(projectId, token);
  }
  const current = await publicInvitationApi.get(token);
  return current.invitation.openedAt ? current : publicInvitationApi.opened(token);
}

async function submitInvitation(projectId: string, token: string, request: PublicRsvpRequest): Promise<PublicInvitationView> {
  return appConfig.dataMode === 'json'
    ? writeLocalResponse(projectId, token, request)
    : publicInvitationApi.rsvp(token, request);
}

export function InviteApp() {
  const token = useMemo(getToken, []);
  const projectId = useMemo(getProjectId, []);
  const [view, setView] = useState<PublicInvitationView | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [attending, setAttending] = useState(true);
  const [companions, setCompanions] = useState(0);
  const [dietary, setDietary] = useState('');
  const [note, setNote] = useState('');

  useEffect(() => {
    if (!token) {
      setError('缺少请帖 Token');
      setLoading(false);
      return;
    }
    void loadInvitation(projectId, token).then(result => {
      setView(result);
      setCompanions(result.guest.companions);
      setDietary(result.guest.dietary);
      document.documentElement.dataset.theme = result.invitation.template;
    }).catch(loadError => {
      setError(loadError instanceof Error ? loadError.message : '请帖加载失败');
    }).finally(() => setLoading(false));
  }, [projectId, token]);

  const submit = async () => {
    if (!view) return;
    setSubmitting(true);
    try {
      setView(await submitInvitation(projectId, token, { attending, companions, dietary, note }));
      setError('');
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : '回执提交失败');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <main className="invite-status"><div className="invite-loader" /><p>正在打开专属请帖…</p></main>;
  if (error && !view) return <main className="invite-status invite-status--error"><strong>无法打开请帖</strong><p>{error}</p></main>;
  if (!view) return null;

  const confirmed = Boolean(view.invitation.respondedAt);
  return <main className={`invite-page invite-page--${view.invitation.template}`}>
    <div className="invite-particles" aria-hidden="true"><i /><i /><i /><i /><i /></div>
    <section className="invite-card">
      <span className="invite-crown">♛</span>
      <small>THE WEDDING OF</small>
      <h1>{view.profile.groomName}<i>＆</i>{view.profile.brideName}</h1>
      <div className="invite-divider" />
      <h2>{view.invitation.salutation}</h2>
      <p>{view.invitation.message}</p>
      <dl>
        <div><dt>日期</dt><dd>{view.profile.weddingDate}</dd></div>
        <div><dt>仪式</dt><dd>{view.profile.ceremonyTime}</dd></div>
        <div><dt>宴会</dt><dd>{view.profile.banquetTime}</dd></div>
      </dl>
      <address><strong>{view.profile.venueName}</strong><span>{view.profile.venueAddress}</span></address>
    </section>

    <section className="rsvp-card">
      {confirmed ? <div className="rsvp-success"><span>✓</span><h2>回执已经收到</h2><p>{view.guest.rsvp === '已确认' ? '期待在婚礼现场与您相见。' : '感谢您的回复，我们会将祝福珍藏。'}</p><button className="rsvp-edit" onClick={() => setView({ ...view, invitation: { ...view.invitation, respondedAt: '' } })}>修改我的回执</button></div> : <>
        <header><small>RSVP</small><h2>是否赴约</h2><p>请在方便时完成回执，便于我们安排席位与餐饮。</p></header>
        <div className="attendance-switch"><button className={attending ? 'is-active' : ''} onClick={() => setAttending(true)}>欣然赴约</button><button className={!attending ? 'is-active' : ''} onClick={() => setAttending(false)}>遗憾缺席</button></div>
        {attending && <div className="rsvp-form"><label><span>携同人数</span><input type="number" min="0" max="9" value={companions} onChange={event => setCompanions(Number(event.target.value))} /></label><label><span>忌口与饮食偏好</span><input value={dietary} onChange={event => setDietary(event.target.value)} placeholder="没有可留空" /></label></div>}
        <label className="rsvp-note"><span>给新人的话</span><textarea value={note} onChange={event => setNote(event.target.value)} placeholder="写下一句祝福" /></label>
        {error && <p className="rsvp-error">{error}</p>}
        <button className="rsvp-submit" disabled={submitting} onClick={() => void submit()}>{submitting ? '正在提交…' : '确认回执'}</button>
      </>}
    </section>
    <footer className="invite-footer">Wedding OS · 专属电子请帖</footer>
  </main>;
}
