import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { WeddingOperationsDraft, WeddingTemplateId } from './model';
import { operationsStorageKey } from './model';
import { consumePendingOperationsTemplate } from './pendingTemplate';
import { createOperationsDraft, weddingTemplatePacks } from './templatePacks';
import { operationsApi } from '../../services/api/operationsApi';

function validTemplate(value: unknown): value is WeddingTemplateId {
  return weddingTemplatePacks.some(item => item.id === value);
}

function parseDraftObject(value: unknown): WeddingOperationsDraft | null {
  if (!value || typeof value !== 'object') return null;
  const parsed = value as Partial<WeddingOperationsDraft>;
  if (parsed.version !== 1 || !validTemplate(parsed.templateId)) return null;
  if (!Array.isArray(parsed.menus) || !Array.isArray(parsed.beverages) || !Array.isArray(parsed.deployments)) return null;
  if (!Array.isArray(parsed.staffPositions) || !Array.isArray(parsed.hospitalityServices) || !Array.isArray(parsed.ceremonyPrograms)) return null;
  if (!Array.isArray(parsed.vendorDeliveries) || !Array.isArray(parsed.logisticsRecords) || !Array.isArray(parsed.emergencyPlans)) return null;
  return parsed as WeddingOperationsDraft;
}

function parseDraft(value: string | null): WeddingOperationsDraft | null {
  if (!value) return null;
  try {
    return parseDraftObject(JSON.parse(value));
  } catch {
    return null;
  }
}

function firstDraft(projectId: string): WeddingOperationsDraft {
  if (!projectId) return createOperationsDraft('western-hotel');
  const stored = parseDraft(localStorage.getItem(operationsStorageKey(projectId)));
  if (stored) return stored;
  const pending = consumePendingOperationsTemplate(localStorage, projectId);
  const templateId = validTemplate(pending) ? pending : 'western-hotel';
  return createOperationsDraft(templateId);
}

interface ProjectDraftState {
  projectId: string;
  draft: WeddingOperationsDraft;
}

export type OperationsSyncStatus = '本地保存' | '正在加载' | '已同步' | '正在同步' | '同步失败';

export interface OperationsDraftController {
  draft: WeddingOperationsDraft;
  replace(next: WeddingOperationsDraft): void;
  update(updater: (current: WeddingOperationsDraft) => WeddingOperationsDraft): void;
  applyTemplate(templateId: WeddingTemplateId): void;
  resetCurrentTemplate(): void;
  importJson(text: string): void;
  exportJson(): void;
  storageKey: string;
  syncStatus: OperationsSyncStatus;
  syncError: string;
}

export function useOperationsDraft(projectId: string, dataMode: 'json' | 'api'): OperationsDraftController {
  const storageKey = useMemo(
    () => projectId ? (dataMode === 'api' ? `/api/wedding/projects/${projectId}/operations` : operationsStorageKey(projectId)) : '',
    [dataMode, projectId]
  );
  const [state, setState] = useState<ProjectDraftState>(() => ({ projectId, draft: firstDraft(projectId) }));
  const [syncStatus, setSyncStatus] = useState<OperationsSyncStatus>(dataMode === 'api' ? '正在加载' : '本地保存');
  const [syncError, setSyncError] = useState('');
  const revisionRef = useRef(0);
  const apiHydratedRef = useRef(false);
  const suppressNextApiSaveRef = useRef(true);
  const activeProjectRef = useRef(projectId);
  const saveQueueRef = useRef<Promise<void>>(Promise.resolve());

  useEffect(() => {
    activeProjectRef.current = projectId;
    revisionRef.current = 0;
    apiHydratedRef.current = false;
    suppressNextApiSaveRef.current = true;
    saveQueueRef.current = Promise.resolve();
    setSyncError('');

    if (!projectId) {
      setState({ projectId, draft: createOperationsDraft('western-hotel') });
      setSyncStatus(dataMode === 'api' ? '正在加载' : '本地保存');
      return;
    }

    if (dataMode === 'json') {
      setState({ projectId, draft: firstDraft(projectId) });
      setSyncStatus('本地保存');
      return;
    }

    setState({ projectId, draft: createOperationsDraft('western-hotel') });
    setSyncStatus('正在加载');
    let active = true;
    operationsApi.get(projectId)
      .then(result => {
        if (!active || activeProjectRef.current !== projectId) return;
        const parsed = parseDraftObject(result.draft);
        if (!parsed) throw new Error('后端婚礼全案数据不符合v1契约');
        revisionRef.current = result.revision;
        suppressNextApiSaveRef.current = true;
        apiHydratedRef.current = true;
        setState({ projectId, draft: parsed });
        setSyncStatus('已同步');
      })
      .catch(error => {
        if (!active || activeProjectRef.current !== projectId) return;
        setSyncStatus('同步失败');
        setSyncError(error instanceof Error ? error.message : '婚礼全案加载失败');
      });
    return () => {
      active = false;
    };
  }, [dataMode, projectId]);

  useEffect(() => {
    if (dataMode !== 'json' || !storageKey || state.projectId !== projectId) return;
    localStorage.setItem(storageKey, JSON.stringify({ ...state.draft, updatedAt: new Date().toISOString() }));
  }, [dataMode, projectId, state, storageKey]);

  useEffect(() => {
    if (dataMode !== 'api' || !projectId || state.projectId !== projectId || !apiHydratedRef.current) return;
    if (suppressNextApiSaveRef.current) {
      suppressNextApiSaveRef.current = false;
      return;
    }
    const draft = structuredClone(state.draft);
    setSyncStatus('正在同步');
    setSyncError('');
    saveQueueRef.current = saveQueueRef.current
      .catch(() => undefined)
      .then(async () => {
        const result = await operationsApi.replace(projectId, revisionRef.current, draft);
        if (activeProjectRef.current !== projectId) return;
        revisionRef.current = result.revision;
        setSyncStatus('已同步');
      })
      .catch(error => {
        if (activeProjectRef.current !== projectId) return;
        setSyncStatus('同步失败');
        setSyncError(error instanceof Error ? error.message : '婚礼全案保存失败');
      });
  }, [dataMode, projectId, state]);

  const replace = useCallback((next: WeddingOperationsDraft) => {
    setState(current => ({ ...current, draft: { ...structuredClone(next), updatedAt: new Date().toISOString() } }));
  }, []);

  const update = useCallback((updater: (current: WeddingOperationsDraft) => WeddingOperationsDraft) => {
    setState(current => ({ ...current, draft: { ...updater(structuredClone(current.draft)), updatedAt: new Date().toISOString() } }));
  }, []);

  const applyTemplate = useCallback((templateId: WeddingTemplateId) => {
    setState(current => ({ ...current, draft: createOperationsDraft(templateId) }));
  }, []);

  const resetCurrentTemplate = useCallback(() => {
    setState(current => ({ ...current, draft: createOperationsDraft(current.draft.templateId) }));
  }, []);

  const importJson = useCallback((text: string) => {
    const parsed = parseDraft(text);
    if (!parsed) throw new Error('导入失败：文件不是 Wedding OS 婚礼全案 v1 草案。');
    setState(current => ({ ...current, draft: { ...parsed, updatedAt: new Date().toISOString() } }));
  }, []);

  const exportJson = useCallback(() => {
    const content = JSON.stringify(state.draft, null, 2);
    const url = URL.createObjectURL(new Blob([content], { type: 'application/json;charset=utf-8' }));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `婚礼全案-${state.draft.templateName}-${new Date().toISOString().slice(0, 10)}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  }, [state.draft]);

  return {
    draft: state.draft,
    replace,
    update,
    applyTemplate,
    resetCurrentTemplate,
    importJson,
    exportJson,
    storageKey,
    syncStatus,
    syncError
  };
}
