import { useRef, useState } from 'react';
import { Icon } from '../../components/Icon';
import { LoadingState } from '../../components/LoadingState';
import { PageHeader } from '../../components/PageHeader';
import { openExternalWindow } from '../../lib/browserActions';
import { useWeddingData } from '../../state/WeddingDataProvider';
import type { Attachment } from '../../types/domain';
import { createAttachmentMetadata, formatFileSize } from '../../services/attachments/attachmentService';
import { canDownloadAttachment, canViewAttachment } from '../../services/attachments/attachmentPermissions';
import { getAttachmentDownloadUrl, uploadAttachmentFile } from '../../services/api/attachmentApi';
import { deleteLocalAttachment, downloadLocalAttachment, storeLocalAttachment } from '../../services/attachments/localAttachmentStore';

const entityOptions = [
  ['project', '项目资料'], ['vendor', '供应商'], ['contract', '合同'], ['budget', '预算项'],
  ['timeline', '流程节点'], ['material', '物料'], ['risk', '风险预案'], ['guest', '宾客']
] as const;

export function AttachmentsPage() {
  const { data, loading, dataMode, currentUser, updateCollection, can } = useWeddingData();
  const [entityType, setEntityType] = useState('project');
  const [entityId, setEntityId] = useState('');
  const [visibility, setVisibility] = useState<Attachment['visibility']>('项目成员');
  const [notice, setNotice] = useState('');
  const [uploading, setUploading] = useState(false);
  const [workingId, setWorkingId] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  if (loading || !data) return <LoadingState />;
  const writable = can('execution.write');
  const exportAllowed = can('privacy.export');
  const role = currentUser?.role ?? '只读';
  const visibleAttachments = data.attachments.filter(item => canViewAttachment(role, item.visibility));

  const addFiles = async (files: FileList | null) => {
    if (!writable || !files?.length) return;
    if (visibility === '仅所有者' && role !== '所有者') {
      setNotice('只有项目所有者可以上传“仅所有者”附件。');
      return;
    }
    setUploading(true);
    try {
      const created = await Promise.all(Array.from(files).map(async file => {
        const metadata = await createAttachmentMetadata(
          file, entityType, entityId || data.projectId, currentUser?.name ?? data.profile.coordinatorName, visibility
        );
        return dataMode === 'api'
          ? uploadAttachmentFile(data.projectId, file, metadata)
          : storeLocalAttachment(data.projectId, file, metadata);
      }));
      updateCollection('attachments', list => [...list, ...created]);
      setNotice(dataMode === 'api'
        ? `已上传并登记 ${created.length} 个附件。`
        : `已把 ${created.length} 个附件真实保存到本地项目存储。`);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : '附件登记失败');
    } finally {
      setUploading(false);
    }
  };

  const download = async (attachment: Attachment) => {
    if (!canDownloadAttachment(role, attachment.visibility, exportAllowed)) {
      setNotice('当前角色无权查看或下载该附件。');
      return;
    }
    setWorkingId(attachment.id);
    try {
      if (dataMode === 'api') {
        const url = await getAttachmentDownloadUrl(data.projectId, attachment.id);
        openExternalWindow(url);
      } else {
        await downloadLocalAttachment(data.projectId, attachment);
      }
      setNotice(`已准备下载：${attachment.fileName}`);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : '附件下载失败');
    } finally {
      setWorkingId('');
    }
  };

  const removeAttachment = async (attachment: Attachment) => {
    if (!writable || !canViewAttachment(role, attachment.visibility) || !window.confirm(`确认删除附件“${attachment.fileName}”吗？`)) return;
    setWorkingId(attachment.id);
    try {
      if (dataMode === 'json') await deleteLocalAttachment(data.projectId, attachment);
      updateCollection('attachments', list => list.filter(item => item.id !== attachment.id));
      setNotice(dataMode === 'api'
        ? `已从附件集合移除 ${attachment.fileName}；服务端按元数据变更执行对象回收。`
        : `已删除附件及其真实文件：${attachment.fileName}`);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : '附件删除失败');
    } finally {
      setWorkingId('');
    }
  };

  const filtered = visibleAttachments.filter(item => !entityId || item.entityId.includes(entityId));

  return <div className="page attachments-page">
    <PageHeader eyebrow="DOCUMENT CONTROL" title="附件中心" description="API 模式使用对象存储；Tauri 使用 AppData 项目目录；浏览器本地模式使用 IndexedDB 保存真实文件。" actions={<><button className="button" disabled={!writable || uploading} onClick={() => inputRef.current?.click()}><Icon name="upload" />{uploading ? '正在上传…' : '添加附件'}</button><input ref={inputRef} hidden multiple type="file" onChange={event => { void addFiles(event.target.files); event.currentTarget.value = ''; }} /></>} />
    {notice && <div className="global-alert" role={/失败|阻止|无权|只有/.test(notice) ? 'alert' : 'status'}><Icon name={/失败|阻止|无权|只有/.test(notice) ? 'warning' : 'check'} /><span>{notice}</span><button onClick={() => setNotice('')}>关闭</button></div>}

    <section className="panel attachment-toolbar">
      <label><span>关联类型</span><select disabled={!writable} value={entityType} onChange={event => setEntityType(event.target.value)}>{entityOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
      <label><span>关联业务 ID</span><input disabled={!writable} value={entityId} onChange={event => setEntityId(event.target.value)} placeholder={`默认关联项目 ${data.projectId}`} /></label>
      <label><span>可见范围</span><select disabled={!writable} value={visibility} onChange={event => setVisibility(event.target.value as Attachment['visibility'])}><option>项目成员</option><option disabled={role !== '所有者'}>仅所有者</option></select></label>
      <button className="button button--ghost" onClick={() => setEntityId('')}>清除筛选</button>
    </section>

    <section className="stats-grid"><article className="metric panel"><span>可见附件</span><strong>{visibleAttachments.length}</strong><small>已按当前角色过滤</small></article><article className="metric panel"><span>占用空间</span><strong>{formatFileSize(visibleAttachments.reduce((sum, item) => sum + item.size, 0))}</strong><small>当前可见真实文件</small></article><article className="metric panel"><span>仅所有者</span><strong>{visibleAttachments.filter(item => item.visibility === '仅所有者').length}</strong><small>只对项目所有者展示</small></article><article className="metric panel"><span>重复哈希</span><strong>{visibleAttachments.length - new Set(visibleAttachments.map(item => item.hash)).size}</strong><small>可用于去重</small></article></section>

    <section className="panel table-card"><div className="table-scroll"><table className="data-table"><thead><tr><th>文件</th><th>关联业务</th><th>大小</th><th>上传人</th><th>时间</th><th>可见范围</th><th>SHA-256</th><th /></tr></thead><tbody>{filtered.map(item => <tr key={item.id}><td><strong>{item.fileName}</strong><small>{item.mimeType}</small></td><td>{item.entityType}<small>{item.entityId}</small></td><td>{formatFileSize(item.size)}</td><td>{item.uploadedBy}</td><td>{new Date(item.uploadedAt).toLocaleString()}</td><td>{item.visibility}</td><td><code>{item.hash.slice(0, 12)}…</code></td><td><div className="row-actions"><button className="icon-button" title={exportAllowed ? '下载附件' : '当前角色没有隐私数据导出权限'} disabled={workingId === item.id || !canDownloadAttachment(role, item.visibility, exportAllowed)} aria-label={`下载附件 ${item.fileName}`} onClick={() => void download(item)}><Icon name="download" /></button><button className="icon-button icon-button--danger" disabled={!writable || workingId === item.id} aria-label={`删除附件 ${item.fileName}`} onClick={() => void removeAttachment(item)}><Icon name="trash" /></button></div></td></tr>)}</tbody></table></div></section>
  </div>;
}