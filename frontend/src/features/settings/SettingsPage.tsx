import { useRef, useState } from 'react';
import { Icon } from '../../components/Icon';
import { LoadingState } from '../../components/LoadingState';
import { PageHeader } from '../../components/PageHeader';
import { createId } from '../../lib/id';
import { useWeddingData } from '../../state/WeddingDataProvider';
import type { MemberRole, ProjectMember, ProjectSettings, WeddingProfile } from '../../types/domain';

const roles: MemberRole[] = ['所有者', '总指挥', '协作者', '只读'];

export function SettingsPage() {
  const {
    data, loading, dataMode, currentUser, can, updateProfile, updateSettings, updateDatabase,
    exportJson, exportEncrypted, importEncrypted, restoreBackup, resetData
  } = useWeddingData();
  const [notice, setNotice] = useState('');
  const [confirmName, setConfirmName] = useState('');
  const [password, setPassword] = useState('');
  const [working, setWorking] = useState(false);
  const encryptedInput = useRef<HTMLInputElement>(null);

  if (loading || !data) return <LoadingState />;
  const writable = can('project.write');
  const memberWritable = can('member.manage');
  const activeOwnerCount = data.members.filter(member => member.role === '所有者' && member.active).length;

  const patchProfile = (key: keyof WeddingProfile, value: string) => {
    if (writable) updateProfile({ ...data.profile, [key]: value });
  };
  const patchSettings = <K extends keyof ProjectSettings>(key: K, value: ProjectSettings[K]) => {
    if (writable) updateSettings({ ...data.settings, [key]: value });
  };
  const patchMember = (id: string, patch: Partial<ProjectMember>) => {
    if (!memberWritable) return;
    const current = data.members.find(member => member.id === id);
    if (current?.role === '所有者' && current.active && patch.active === false && activeOwnerCount <= 1) {
      setNotice('项目至少保留一名启用的所有者；请先将另一名成员设为所有者。');
      return;
    }
    updateDatabase(database => ({ ...database, members: database.members.map(member => member.id === id ? { ...member, ...patch } : member) }));
  };
  const addMember = () => {
    if (!memberWritable) return;
    updateDatabase(database => ({ ...database, members: [...database.members, { id: createId('member'), name: '新协作者', email: '', role: '协作者', active: true }] }));
  };
  const removeMember = (id: string) => {
    if (!memberWritable || !window.confirm('确认删除该协作成员吗？')) return;
    updateDatabase(database => ({ ...database, members: database.members.filter(member => member.id !== id) }));
  };
  const restore = async () => {
    if (working) return;
    setWorking(true);
    try {
      await restoreBackup();
      setNotice('已从最近一次本地备份恢复。');
    } catch (error) {
      setNotice(error instanceof Error ? `恢复失败：${error.message}` : '恢复失败');
    } finally {
      setWorking(false);
    }
  };
  const reset = async () => {
    if (confirmName !== data.settings.projectName) {
      setNotice('请输入完整项目名称后再重置。');
      return;
    }
    if (!window.confirm('重置会覆盖当前项目数据。确认继续吗？')) return;
    setWorking(true);
    try {
      await resetData();
      setConfirmName('');
      setNotice('项目已恢复为演示初始数据。');
    } catch (error) {
      setNotice(error instanceof Error ? `重置失败：${error.message}` : '重置失败');
    } finally {
      setWorking(false);
    }
  };
  const validatePassword = (): boolean => {
    if (password.length >= 8) return true;
    setNotice('备份密码至少需要 8 位。');
    return false;
  };
  const secureExport = async () => {
    if (!validatePassword() || working) return;
    setWorking(true);
    try {
      await exportEncrypted(password);
      setNotice('加密备份已生成，请妥善保管密码。');
    } catch (error) {
      setNotice(error instanceof Error ? `加密导出失败：${error.message}` : '加密导出失败');
    } finally {
      setWorking(false);
    }
  };
  const secureImport = async (file: File) => {
    if (!validatePassword() || working) return;
    setWorking(true);
    try {
      await importEncrypted(file, password);
      setNotice('加密备份恢复完成。');
    } catch (error) {
      setNotice(error instanceof Error ? `加密恢复失败：${error.message}` : '加密恢复失败');
    } finally {
      setWorking(false);
    }
  };

  return <div className="page settings-page">
    <PageHeader eyebrow="PROJECT GOVERNANCE" title="项目设置" description="集中维护婚礼资料、角色权限、隐私、加密备份、恢复与只读审计。" actions={<button className="button button--ghost" disabled={!can('privacy.export')} onClick={exportJson}><Icon name="download" />导出完整备份</button>} />

    {notice && <div className="global-alert" role={/失败|至少|请输入/.test(notice) ? 'alert' : 'status'}><Icon name={/失败|至少|请输入/.test(notice) ? 'warning' : 'check'} /><span>{notice}</span><button onClick={() => setNotice('')}>关闭</button></div>}

    <section className="settings-grid">
      <article className="panel settings-card"><header><div><span className="eyebrow">PROJECT</span><h2>项目治理</h2></div><Icon name="settings" /></header><div className="form-grid">
        <label className="form-wide"><span>项目名称</span><input disabled={!writable} value={data.settings.projectName} onChange={event => patchSettings('projectName', event.target.value)} /></label>
        <label><span>项目状态</span><select disabled={!writable} value={data.settings.status} onChange={event => patchSettings('status', event.target.value as ProjectSettings['status'])}><option>筹备中</option><option>已完成</option><option>已归档</option></select></label>
        <label><span>时区</span><select disabled={!writable} value={data.settings.timezone} onChange={event => patchSettings('timezone', event.target.value)}><option value="Asia/Shanghai">中国标准时间</option><option value="Asia/Tokyo">日本标准时间</option><option value="Asia/Hong_Kong">香港时间</option></select></label>
        <label><span>自动锁定分钟</span><input disabled={!writable} type="number" min="0" value={data.settings.autoLockMinutes} onChange={event => patchSettings('autoLockMinutes', Math.max(0, Number(event.target.value)))} /></label>
        <label className="switch"><input disabled={!writable} type="checkbox" checked={data.settings.maskSensitiveByDefault} onChange={event => patchSettings('maskSensitiveByDefault', event.target.checked)} /><span>默认脱敏手机号</span></label>
        <label><span>项目 ID</span><input value={data.projectId} readOnly /></label><label><span>数据版本</span><input value={`Schema v${data.schemaVersion} / Revision ${data.revision}`} readOnly /></label><label><span>当前用户</span><input value={`${currentUser?.name ?? '本地用户'} / ${currentUser?.role ?? '未知角色'}`} readOnly /></label><label><span>运行模式</span><input value={dataMode === 'api' ? '真实后端 API' : '本地多项目数据库'} readOnly /></label>
      </div></article>

      <article className="panel settings-card"><header><div><span className="eyebrow">WEDDING PROFILE</span><h2>婚礼基础资料</h2></div><Icon name="sparkles" /></header><div className="form-grid">
        <label><span>新郎姓名</span><input disabled={!writable} value={data.profile.groomName} onChange={event => patchProfile('groomName', event.target.value)} /></label><label><span>新娘姓名</span><input disabled={!writable} value={data.profile.brideName} onChange={event => patchProfile('brideName', event.target.value)} /></label><label><span>婚礼日期</span><input disabled={!writable} type="date" value={data.profile.weddingDate} onChange={event => patchProfile('weddingDate', event.target.value)} /></label><label><span>仪式时间</span><input disabled={!writable} type="time" value={data.profile.ceremonyTime} onChange={event => patchProfile('ceremonyTime', event.target.value)} /></label><label><span>宴会时间</span><input disabled={!writable} type="time" value={data.profile.banquetTime} onChange={event => patchProfile('banquetTime', event.target.value)} /></label><label><span>总指挥</span><input disabled={!writable} value={data.profile.coordinatorName} onChange={event => patchProfile('coordinatorName', event.target.value)} /></label><label className="form-wide"><span>酒店 / 场地</span><input disabled={!writable} value={data.profile.venueName} onChange={event => patchProfile('venueName', event.target.value)} /></label><label className="form-wide"><span>详细地址</span><input disabled={!writable} value={data.profile.venueAddress} onChange={event => patchProfile('venueAddress', event.target.value)} /></label><label><span>联系电话</span><input disabled={!writable} value={data.profile.phone} onChange={event => patchProfile('phone', event.target.value)} /></label>
      </div></article>
    </section>

    <section className="panel settings-card"><header><div><span className="eyebrow">TEAM ACCESS</span><h2>协作成员与角色</h2></div><button className="button button--ghost" disabled={!memberWritable} onClick={addMember}><Icon name="plus" />新增成员</button></header><div className="member-list">{data.members.map(member => {
      const lastActiveOwner = member.role === '所有者' && member.active && activeOwnerCount <= 1;
      return <div key={member.id} className="member-row"><input disabled={!memberWritable} value={member.name} onChange={event => patchMember(member.id, { name: event.target.value })} /><input disabled={!memberWritable} type="email" placeholder="成员邮箱" value={member.email} onChange={event => patchMember(member.id, { email: event.target.value })} /><select disabled={!memberWritable || member.role === '所有者'} value={member.role} onChange={event => patchMember(member.id, { role: event.target.value as MemberRole })}>{roles.map(role => <option key={role}>{role}</option>)}</select><label className="switch" title={lastActiveOwner ? '项目至少保留一名启用的所有者' : '启用成员'}><input disabled={!memberWritable || lastActiveOwner} type="checkbox" checked={member.active} onChange={event => patchMember(member.id, { active: event.target.checked })} /><span>启用</span></label><button className="icon-button icon-button--danger" aria-label={`删除成员 ${member.name}`} disabled={!memberWritable || member.role === '所有者'} onClick={() => removeMember(member.id)}><Icon name="trash" /></button></div>;
    })}</div></section>

    <section className="settings-grid">
      <article className="panel settings-card"><header><div><span className="eyebrow">ENCRYPTED BACKUP</span><h2>密码加密备份</h2></div><Icon name="lock" /></header><p>使用 PBKDF2 + AES-GCM 在本机完成加密。密码和固定密钥不会写入仓库或备份文件。</p><label><span>备份密码</span><input type="password" value={password} onChange={event => setPassword(event.target.value)} placeholder="至少 8 位" /></label><div className="settings-actions"><button className="button button--ghost" disabled={!can('privacy.export') || working} onClick={() => void secureExport()}>导出加密备份</button><button className="button button--ghost" disabled={!writable || working} onClick={() => encryptedInput.current?.click()}>恢复加密备份</button><input ref={encryptedInput} hidden type="file" accept="application/json" onChange={event => { const file = event.target.files?.[0]; if (file) void secureImport(file); event.currentTarget.value = ''; }} /></div></article>
      <article className="panel settings-card"><header><div><span className="eyebrow">RECOVERY</span><h2>普通备份与恢复</h2></div><Icon name="database" /></header><p>每次本地保存前保留同项目上一版本。导入时先执行 Schema v4 迁移与引用完整性校验。</p><div className="settings-actions"><button className="button button--ghost" disabled={!can('privacy.export')} onClick={exportJson}>导出当前版本</button><button className="button button--ghost" disabled={dataMode === 'api' || !writable || working} onClick={() => void restore()}>恢复最近备份</button></div></article>
    </section>

    <section className="panel settings-card audit-card"><header><div><span className="eyebrow">AUDIT TRAIL</span><h2>只读审计日志</h2></div><span>{data.auditLogs.length}</span></header><div className="audit-list">{data.auditLogs.slice(-12).reverse().map(log => <div key={log.id}><time>{new Date(log.createdAt).toLocaleString()}</time><strong>{log.action}</strong><span>{log.operatorName || '系统'} · {log.operatorRole || '未知角色'}</span><small>{log.detail}</small></div>)}</div></section>

    <section className="panel settings-card settings-card--danger"><header><div><span className="eyebrow">DANGER ZONE</span><h2>危险操作</h2></div><Icon name="warning" /></header><p>重置将覆盖当前项目数据。请输入项目名称 <strong>{data.settings.projectName}</strong> 进行二次确认。</p><input disabled={!writable || working} value={confirmName} onChange={event => setConfirmName(event.target.value)} placeholder="输入完整项目名称" /><button className="button button--danger" disabled={!writable || working} onClick={() => void reset()}>{working ? '处理中…' : '重置当前项目数据'}</button></section>
  </div>;
}