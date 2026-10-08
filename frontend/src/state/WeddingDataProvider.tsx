import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { repository } from '../repositories/repositoryFactory';
import type { CommandPayload, CreateProjectInput, ProjectCommand, ProjectSummary, WeddingDatabase } from '../types/domain';
import type { Permission } from '../services/permissions/permissionMatrix';
import { permissionForCommand, rolePermissions } from '../services/permissions/permissionMatrix';
import { inferDatabaseMutationPermissions } from '../services/permissions/databaseMutationPermission';
import { assertProjectGovernance } from '../services/permissions/projectGovernance';
import { assertPermission, getCurrentUser } from '../services/auth/currentUser';
import { readAuthSession } from '../services/auth/authSession';
import { appConfig } from '../config/appConfig';
import { importEncryptedDatabase, exportEncryptedDatabase, type EncryptedExport } from '../services/security/cryptoExport';
import { consumePendingOperationsTemplate } from '../features/operations/pendingTemplate';
import { createOutboxCommand, listOutboxCommands, markOutboxAttempt, removeOutboxCommand } from '../services/persistence/outboxStore';
import { acceptProjectSnapshot } from '../services/persistence/projectSnapshotGuard';
import { createConflictFromError, listConflicts, removeConflict, upsertConflict } from '../services/persistence/conflictStore';
import { deleteLocalProject, listLocalProjects, readActiveProjectId, registerLocalProject, writeActiveProjectId } from '../services/projects/projectCatalog';
import type { ConflictRecord } from '../types/domain';

type SaveOptions = {
  permission?: Permission;
  commandType?: ProjectCommand['type'];
  commandPayload?: CommandPayload;
};

interface WeddingDataContextValue {
  data: WeddingDatabase | null;
  projects: ProjectSummary[];
  activeProjectId: string;
  loading: boolean;
  status: string;
  error: string;
  dataMode: 'json' | 'api';
  currentRole: string;
  permissions: ReadonlySet<Permission>;
  can(permission: Permission): boolean;
  mutate(updater: (current: WeddingDatabase) => WeddingDatabase, options?: SaveOptions): void;
  replaceCollection<K extends keyof WeddingDatabase>(key: K, value: WeddingDatabase[K], permission?: Permission): void;
  updateDatabase(updater: (current: WeddingDatabase) => WeddingDatabase, permission?: Permission): void;
  acceptRemoteSnapshot(snapshot: WeddingDatabase): void;
  reload(): Promise<void>;
  reset(): Promise<void>;
  exportEncrypted(password: string): Promise<EncryptedExport>;
  importEncrypted(payload: EncryptedExport, password: string): Promise<void>;
  switchProject(projectId: string): Promise<void>;
  createProject(input: CreateProjectInput): Promise<void>;
  deleteProject(projectId: string): Promise<void>;
  refreshProjects(): Promise<void>;
  conflicts: ConflictRecord[];
  retryConflict(conflictId: string): Promise<void>;
  useRemoteConflict(conflictId: string): Promise<void>;
  discardConflict(conflictId: string): Promise<void>;
}

const WeddingDataContext = createContext<WeddingDataContextValue | null>(null);
const projectQueues = new Map<string, Promise<void>>();

function enqueueProjectSave<T>(projectId: string, task: () => Promise<T>): Promise<T> {
  const previous = projectQueues.get(projectId) ?? Promise.resolve();
  const current = previous.catch(() => undefined).then(task);
  const tracked = current.then(() => undefined, () => undefined);
  projectQueues.set(projectId, tracked);
  void tracked.finally(() => {
    if (projectQueues.get(projectId) === tracked) projectQueues.delete(projectId);
  });
  return current;
}

async function listCatalog(): Promise<ProjectSummary[]> {
  if (repository.mode === 'api') return repository.listProjects();
  return listLocalProjects();
}

async function resolveInitialProjectId(): Promise<string> {
  const catalog = await listCatalog();
  if (repository.mode === 'api') return catalog[0]?.projectId ?? appConfig.defaultProjectId;
  const preferred = readActiveProjectId();
  if (preferred && catalog.some(item => item.projectId === preferred)) return preferred;
  if (catalog[0]) return catalog[0].projectId;
  return appConfig.defaultProjectId;
}

export function WeddingDataProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<WeddingDatabase | null>(null);
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [activeProjectId, setActiveProjectId] = useState('');
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('准备加载数据');
  const [error, setError] = useState('');
  const [conflicts, setConflicts] = useState<ConflictRecord[]>(() => listConflicts());
  const activeProjectRef = useRef('');
  const dataRef = useRef<WeddingDatabase | null>(null);
  useEffect(() => { activeProjectRef.current = activeProjectId; }, [activeProjectId]);
  useEffect(() => { dataRef.current = data; }, [data]);

  const refreshProjects = useCallback(async () => {
    const catalog = await listCatalog();
    setProjects(catalog);
  }, []);

  const loadProject = useCallback(async (projectId: string) => {
    setLoading(true);
    setError('');
    try {
      const next = await repository.load(projectId);
      if (repository.mode === 'json') {
        await registerLocalProject(next);
        writeActiveProjectId(next.projectId);
      }
      setData(next);
      setActiveProjectId(next.projectId);
      setStatus(`已加载 ${next.settings.projectName}`);
      const catalog = await listCatalog();
      setProjects(catalog);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : '数据加载失败');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void (async () => {
      const projectId = await resolveInitialProjectId();
      await loadProject(projectId);
    })();
  }, [loadProject]);

  const currentUser = useMemo(() => {
    if (!data) return null;
    const session = readAuthSession();
    const identity = session ? { id: session.userId, name: session.userName } : undefined;
    return getCurrentUser(data, { identity, allowLocalOwner: appConfig.authMode === 'disabled' && repository.mode === 'json' });
  }, [data]);
  const permissions = useMemo(() => currentUser ? rolePermissions(currentUser.role) : new Set<Permission>(), [currentUser]);
  const can = useCallback((permission: Permission) => permissions.has(permission), [permissions]);

  const refreshCatalogAfterSave = useCallback(async (saved: WeddingDatabase) => {
    if (repository.mode === 'json') await registerLocalProject(saved);
    const catalog = await listCatalog();
    setProjects(catalog);
  }, []);

  const acceptRemoteSnapshot = useCallback((snapshot: WeddingDatabase) => {
    setData(current => acceptProjectSnapshot(current, snapshot));
    dataRef.current = snapshot;
    setStatus('已同步后端最新版本');
    setError('');
    void refreshCatalogAfterSave(snapshot);
  }, [refreshCatalogAfterSave]);

  const mutate = useCallback((updater: (current: WeddingDatabase) => WeddingDatabase, options: SaveOptions = {}) => {
    const currentSnapshot = dataRef.current;
    if (!currentSnapshot || !currentUser) return;
    const preview = updater(structuredClone(currentSnapshot));
    const requiredPermissions = options.permission
      ? new Set<Permission>([options.permission])
      : inferDatabaseMutationPermissions(currentSnapshot, preview);
    try {
      for (const permission of requiredPermissions) assertPermission(currentUser, permission);
      assertProjectGovernance(currentSnapshot, preview, currentUser);
    } catch (permissionError) {
      setError(permissionError instanceof Error ? permissionError.message : '无权执行此操作');
      return;
    }
    const projectId = currentSnapshot.projectId;
    const commandType = options.commandType ?? 'database.replace';
    const permission = options.permission ?? [...requiredPermissions][0] ?? 'project.write';
    const command: ProjectCommand = {
      id: crypto.randomUUID(),
      projectId,
      baseRevision: currentSnapshot.revision,
      idempotencyKey: crypto.randomUUID(),
      permission,
      type: commandType,
      createdAt: new Date().toISOString(),
      payload: options.commandPayload ?? { database: preview }
    };
    void createOutboxCommand(command).then(() => {
      if (activeProjectRef.current === projectId) setStatus('等待同步');
    });
    void enqueueProjectSave(projectId, async () => {
      const latest = dataRef.current?.projectId === projectId ? dataRef.current : currentSnapshot;
      const next = updater(structuredClone(latest));
      for (const requiredPermission of requiredPermissions) assertPermission(currentUser, requiredPermission);
      assertProjectGovernance(latest, next, currentUser);
      try {
        await markOutboxAttempt(command.id, '发送中');
        const saved = commandType === 'database.replace'
          ? await repository.commit(projectId, { ...command, baseRevision: latest.revision, payload: { database: next } })
          : await repository.save(next);
        await removeOutboxCommand(command.id);
        if (activeProjectRef.current === projectId) {
          setData(current => acceptProjectSnapshot(current, saved));
          setStatus('已保存');
          setError('');
        }
        dataRef.current = saved;
        await refreshCatalogAfterSave(saved);
      } catch (saveError) {
        const message = saveError instanceof Error ? saveError.message : '保存失败';
        await markOutboxAttempt(command.id, '失败', message);
        const remoteRevision = saveError && typeof saveError === 'object' && 'remoteRevision' in saveError
          ? Number((saveError as { remoteRevision?: number }).remoteRevision)
          : undefined;
        const conflict = createConflictFromError(command, message, remoteRevision);
        upsertConflict(conflict);
        setConflicts(listConflicts());
        if (activeProjectRef.current === projectId) {
          setError(message);
          setStatus('等待处理冲突');
        }
      }
    });
  }, [currentUser, refreshCatalogAfterSave]);

  const updateDatabase = useCallback((updater: (current: WeddingDatabase) => WeddingDatabase, permission?: Permission) => {
    mutate(updater, { permission });
  }, [mutate]);

  const replaceCollection = useCallback(<K extends keyof WeddingDatabase>(key: K, value: WeddingDatabase[K], permission?: Permission) => {
    mutate(current => ({ ...current, [key]: value }), { permission });
  }, [mutate]);

  const reload = useCallback(async () => {
    if (!activeProjectRef.current) return;
    await loadProject(activeProjectRef.current);
  }, [loadProject]);

  const reset = useCallback(async () => {
    if (!data || !currentUser) return;
    try {
      assertPermission(currentUser, 'project.write');
      const resetData = await repository.reset(data.projectId);
      if (repository.mode === 'json') await registerLocalProject(resetData);
      setData(resetData);
      setStatus('已重置当前项目');
      setError('');
      await refreshProjects();
    } catch (resetError) {
      setError(resetError instanceof Error ? resetError.message : '重置失败');
    }
  }, [currentUser, data, refreshProjects]);

  const exportEncrypted = useCallback(async (password: string) => {
    if (!data || !currentUser) throw new Error('数据尚未加载');
    assertPermission(currentUser, 'privacy.export');
    return exportEncryptedDatabase(data, password);
  }, [currentUser, data]);

  const importEncrypted = useCallback(async (payload: EncryptedExport, password: string) => {
    if (!currentUser || !data) throw new Error('数据尚未加载');
    assertPermission(currentUser, 'privacy.import');
    const imported = await importEncryptedDatabase(payload, password);
    assertProjectGovernance(data, imported, currentUser);
    const saved = await repository.save(imported);
    if (repository.mode === 'json') await registerLocalProject(saved);
    setData(saved);
    setActiveProjectId(saved.projectId);
    writeActiveProjectId(saved.projectId);
    setStatus('加密备份导入成功');
    await refreshProjects();
  }, [currentUser, data, refreshProjects]);

  const switchProject = useCallback(async (projectId: string) => {
    if (projectId === activeProjectRef.current) return;
    await loadProject(projectId);
  }, [loadProject]);

  const createProject = useCallback(async (input: CreateProjectInput) => {
    try {
      const created = await repository.createProject(input);
      if (repository.mode === 'json') {
        await registerLocalProject(created);
        const pendingTemplate = consumePendingOperationsTemplate(localStorage, input.cloneFromProjectId ?? created.projectId);
        if (pendingTemplate) localStorage.setItem(`wedding.operations.pending-template.${created.projectId}`, pendingTemplate);
      }
      await loadProject(created.projectId);
      setStatus('新项目已创建');
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : '创建项目失败');
    }
  }, [loadProject]);

  const deleteProject = useCallback(async (projectId: string) => {
    if (!data || !currentUser) return;
    try {
      assertPermission(currentUser, 'project.delete');
      await repository.deleteProject(projectId);
      if (repository.mode === 'json') await deleteLocalProject(projectId);
      const catalog = await listCatalog();
      setProjects(catalog);
      if (activeProjectRef.current === projectId) {
        const nextProjectId = catalog[0]?.projectId;
        if (nextProjectId) await loadProject(nextProjectId);
        else setData(null);
      }
      setStatus('项目已删除');
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : '删除项目失败');
    }
  }, [currentUser, data, loadProject]);

  const retryConflict = useCallback(async (conflictId: string) => {
    const conflict = listConflicts().find(item => item.id === conflictId);
    if (!conflict || !data || !currentUser) return;
    try {
      assertPermission(currentUser, permissionForCommand(conflict.command));
      const fresh = await repository.load(conflict.projectId);
      const command = { ...conflict.command, baseRevision: fresh.revision, idempotencyKey: crypto.randomUUID() };
      const saved = await repository.commit(conflict.projectId, command);
      removeConflict(conflictId);
      setConflicts(listConflicts());
      if (activeProjectRef.current === conflict.projectId) setData(saved);
      setStatus('冲突命令已重试');
    } catch (retryError) {
      setError(retryError instanceof Error ? retryError.message : '冲突重试失败');
    }
  }, [currentUser, data]);

  const useRemoteConflict = useCallback(async (conflictId: string) => {
    const conflict = listConflicts().find(item => item.id === conflictId);
    if (!conflict || !currentUser) return;
    try {
      assertPermission(currentUser, permissionForCommand(conflict.command));
      const fresh = await repository.load(conflict.projectId);
      removeConflict(conflictId);
      setConflicts(listConflicts());
      if (activeProjectRef.current === conflict.projectId) setData(fresh);
      setStatus('已采用服务端版本');
    } catch (remoteError) {
      setError(remoteError instanceof Error ? remoteError.message : '获取服务端版本失败');
    }
  }, [currentUser]);

  const discardConflict = useCallback(async (conflictId: string) => {
    const conflict = listConflicts().find(item => item.id === conflictId);
    if (conflict?.commandId) await removeOutboxCommand(conflict.commandId);
    removeConflict(conflictId);
    setConflicts(listConflicts());
    setStatus('已放弃本地命令');
  }, []);

  const value = useMemo<WeddingDataContextValue>(() => ({
    data,
    projects,
    activeProjectId,
    loading,
    status,
    error,
    dataMode: repository.mode,
    currentRole: currentUser?.role ?? '未授权',
    permissions,
    can,
    mutate,
    replaceCollection,
    updateDatabase,
    acceptRemoteSnapshot,
    reload,
    reset,
    exportEncrypted,
    importEncrypted,
    switchProject,
    createProject,
    deleteProject,
    refreshProjects,
    conflicts,
    retryConflict,
    useRemoteConflict,
    discardConflict
  }), [
    acceptRemoteSnapshot, activeProjectId, can, conflicts, createProject, currentUser, data, deleteProject,
    discardConflict, error, exportEncrypted, importEncrypted, loading, mutate, permissions, projects,
    reload, replaceCollection, reset, retryConflict, status, switchProject, updateDatabase, useRemoteConflict,
    refreshProjects
  ]);

  return <WeddingDataContext.Provider value={value}>{children}</WeddingDataContext.Provider>;
}

export function useWeddingData(): WeddingDataContextValue {
  const context = useContext(WeddingDataContext);
  if (!context) throw new Error('useWeddingData 必须在 WeddingDataProvider 内使用');
  return context;
}
