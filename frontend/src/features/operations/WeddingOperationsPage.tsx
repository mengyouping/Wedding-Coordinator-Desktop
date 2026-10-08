import { useRef, useState } from 'react';
import { Icon } from '../../components/Icon';
import { LoadingState } from '../../components/LoadingState';
import { PageHeader } from '../../components/PageHeader';
import { useWeddingData } from '../../state/WeddingDataProvider';
import { BanquetCenter } from './centers/BanquetCenter';
import { CeremonyCenter } from './centers/CeremonyCenter';
import { CommandCenter } from './centers/CommandCenter';
import { HospitalityCenter } from './centers/HospitalityCenter';
import { LogisticsCenter } from './centers/LogisticsCenter';
import { StaffingCenter } from './centers/StaffingCenter';
import { VendorDeliveryCenter } from './centers/VendorDeliveryCenter';
import { VenueCenter } from './centers/VenueCenter';
import { OperationsTabs } from './components/OperationsTabs';
import { TemplateSwitcher } from './components/TemplateSwitcher';
import type { OperationsCenterId } from './model';
import { completedRate } from './model';
import { templateMeta } from './templatePacks';
import { useOperationsDraft } from './useOperationsDraft';

export function WeddingOperationsPage() {
  const { data, loading, can, dataMode } = useWeddingData();
  const [active, setActive] = useState<OperationsCenterId>('banquet');
  const [notice, setNotice] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const controller = useOperationsDraft(data?.projectId ?? '', dataMode);
  if (loading || !data) return <LoadingState />;
  const writable = can('execution.write');
  const exportable = can('privacy.export');
  const { draft } = controller;
  const meta = templateMeta(draft.templateId);
  const allRows = [
    ...draft.menus, ...draft.beverages, ...draft.deployments, ...draft.staffPositions,
    ...draft.hospitalityServices, ...draft.ceremonyPrograms, ...draft.vendorDeliveries,
    ...draft.logisticsRecords, ...draft.emergencyPlans
  ];

  const importDraft = async (file: File) => {
    if (!writable) return;
    try {
      controller.importJson(await file.text());
      setNotice('婚礼全案草案导入成功。');
    } catch (error) {
      setNotice(error instanceof Error ? error.message : '婚礼全案草案导入失败。');
    }
  };

  return <div className="page operations-page">
    <PageHeader
      eyebrow="WEDDING OPERATIONS BLUEPRINT"
      title="婚礼全案"
      description="通用核心 + 婚礼类型模板。集中管理宴会、酒水、部署、岗位、接待、仪式、供应商、物流和婚礼日应急细节。"
      actions={<>
        <TemplateSwitcher active={draft.templateId} disabled={!writable || controller.syncStatus === '正在加载'} onApply={controller.applyTemplate} />
        <button className="button button--ghost" disabled={!writable || controller.syncStatus === '正在加载'} onClick={() => inputRef.current?.click()}><Icon name="upload" />导入草案</button>
        <input ref={inputRef} hidden type="file" accept="application/json" onChange={event => { const file = event.target.files?.[0]; if (file) void importDraft(file); event.currentTarget.value = ''; }} />
        <button className="button button--ghost" disabled={!exportable} onClick={controller.exportJson}><Icon name="download" />导出草案</button>
      </>}
    />

    {notice && <div className="global-alert" role={notice.includes('失败') ? 'alert' : 'status'}><Icon name={notice.includes('失败') ? 'warning' : 'check'} /><span>{notice}</span><button onClick={() => setNotice('')}>关闭</button></div>}
    {controller.syncError && <div className="global-alert" role="alert"><Icon name="warning" /><span>{controller.syncError}</span></div>}

    <section className="panel operations-template-hero">
      <div><span className="eyebrow">ACTIVE TEMPLATE</span><h2>{draft.templateName}</h2><p>{meta.description}</p><div>{meta.scenes.map(scene => <span key={scene}>{scene}</span>)}</div></div>
      <dl><div><dt>全案记录</dt><dd>{allRows.length}</dd></div><div><dt>全案完成率</dt><dd>{completedRate(allRows)}%</dd></div><div><dt>最后保存</dt><dd>{new Date(draft.updatedAt).toLocaleString('zh-CN')}</dd></div></dl>
      <button className="button button--ghost" disabled={!writable || controller.syncStatus === '正在加载'} onClick={() => window.confirm('确认恢复当前婚礼模板默认值吗？当前婚礼全案数据会被覆盖。') && controller.resetCurrentTemplate()}><Icon name="conflicts" />恢复模板默认值</button>
    </section>

    <div className="operations-scope-note"><Icon name="database" /><span><strong>{dataMode === 'api' ? '后端正式数据：' : '本地全案草案：'}</strong>{dataMode === 'api' ? `已接入 Wedding Coordinator 后端，当前状态：${controller.syncStatus}。修改会经过 Revision 与幂等校验。` : '项目级自动保存到浏览器；修改会自动保存。'}</span><code>{controller.storageKey}</code></div>

    <OperationsTabs active={active} onChange={setActive} />

    <fieldset disabled={!writable || controller.syncStatus === '正在加载'} className="operations-readonly-fieldset">
      <legend>婚礼全案八中心编辑区域</legend>
      {active === 'banquet' && <BanquetCenter menus={draft.menus} beverages={draft.beverages} onMenusChange={rows => controller.update(current => ({ ...current, menus: rows }))} onBeveragesChange={rows => controller.update(current => ({ ...current, beverages: rows }))} />}
      {active === 'venue' && <VenueCenter rows={draft.deployments} onChange={rows => controller.update(current => ({ ...current, deployments: rows }))} />}
      {active === 'staffing' && <StaffingCenter rows={draft.staffPositions} onChange={rows => controller.update(current => ({ ...current, staffPositions: rows }))} />}
      {active === 'hospitality' && <HospitalityCenter rows={draft.hospitalityServices} onChange={rows => controller.update(current => ({ ...current, hospitalityServices: rows }))} />}
      {active === 'ceremony' && <CeremonyCenter rows={draft.ceremonyPrograms} onChange={rows => controller.update(current => ({ ...current, ceremonyPrograms: rows }))} />}
      {active === 'vendors' && <VendorDeliveryCenter rows={draft.vendorDeliveries} onChange={rows => controller.update(current => ({ ...current, vendorDeliveries: rows }))} />}
      {active === 'logistics' && <LogisticsCenter rows={draft.logisticsRecords} onChange={rows => controller.update(current => ({ ...current, logisticsRecords: rows }))} />}
      {active === 'command' && <CommandCenter draft={draft} onChange={controller.replace} coordinatorName={data.profile.coordinatorName} coordinatorPhone={data.profile.phone} />}
    </fieldset>
  </div>;
}
