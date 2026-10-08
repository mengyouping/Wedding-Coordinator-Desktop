import type { WeddingOperationsDraft } from '../../features/operations/model';
import type { WeddingDatabase } from '../../types/domain';
import { toEntityId, type EntityId } from '../../types/persistence';
import { requestJson } from '../http/httpClient';
import { operationSectionRoutes, type OperationSectionRoute } from './backendRoutes';

export { operationSectionRoutes };

export interface OperationsState {
  draft: WeddingOperationsDraft;
  revision: number;
}

interface OperationsSnapshot extends WeddingDatabase {
  operations: WeddingOperationsDraft;
}

export function buildOperationsPath(
  projectId: EntityId,
  section?: OperationSectionRoute,
  itemId?: EntityId,
  action?: string
): string {
  const safeProjectId = toEntityId(projectId, '婚礼项目ID');
  let path = `/wedding/projects/${encodeURIComponent(safeProjectId)}`;
  if (!section) return `${path}/operations`;
  if (!operationSectionRoutes.includes(section)) throw new Error(`未知婚礼全案领域：${section}`);
  path += `/${section}`;
  if (itemId !== undefined) path += `/${encodeURIComponent(toEntityId(itemId, '婚礼全案实体ID'))}`;
  if (action) path += `/${encodeURIComponent(action)}`;
  return path;
}

function writeHeaders(revision: number): HeadersInit {
  if (!Number.isSafeInteger(revision) || revision < 1) throw new Error('Revision必须为正整数');
  return { 'If-Match': String(revision), 'Idempotency-Key': crypto.randomUUID() };
}

export const operationsApi = {
  async get(projectId: EntityId): Promise<OperationsState> {
    const value = await requestJson<WeddingOperationsDraft & { revision: number }>(buildOperationsPath(projectId));
    const { revision, ...draft } = value;
    if (!Number.isSafeInteger(revision) || revision < 1) throw new Error('婚礼全案响应缺少有效Revision');
    return { draft: draft as WeddingOperationsDraft, revision };
  },

  async replace(projectId: EntityId, revision: number, draft: WeddingOperationsDraft): Promise<OperationsState> {
    const snapshot = await requestJson<OperationsSnapshot>(buildOperationsPath(projectId), {
      method: 'PUT',
      headers: writeHeaders(revision),
      body: JSON.stringify(draft)
    });
    return { draft: snapshot.operations, revision: snapshot.revision };
  },

  getSection<T>(projectId: EntityId, section: OperationSectionRoute): Promise<T> {
    return requestJson<T>(buildOperationsPath(projectId, section));
  },

  replaceSection<T>(projectId: EntityId, section: OperationSectionRoute, revision: number, payload: T): Promise<OperationsSnapshot> {
    return requestJson<OperationsSnapshot>(buildOperationsPath(projectId, section), {
      method: 'PUT', headers: writeHeaders(revision), body: JSON.stringify(payload)
    });
  },

  createItem<T>(projectId: EntityId, section: OperationSectionRoute, revision: number, payload: T): Promise<OperationsSnapshot> {
    return requestJson<OperationsSnapshot>(buildOperationsPath(projectId, section), {
      method: 'POST', headers: writeHeaders(revision), body: JSON.stringify(payload)
    });
  },

  patchItem<T>(projectId: EntityId, section: OperationSectionRoute, itemId: EntityId, revision: number, patch: Partial<T>): Promise<OperationsSnapshot> {
    return requestJson<OperationsSnapshot>(buildOperationsPath(projectId, section, itemId), {
      method: 'PATCH', headers: writeHeaders(revision), body: JSON.stringify(patch)
    });
  },

  removeItem(projectId: EntityId, section: OperationSectionRoute, itemId: EntityId, revision: number): Promise<OperationsSnapshot> {
    return requestJson<OperationsSnapshot>(buildOperationsPath(projectId, section, itemId), {
      method: 'DELETE', headers: writeHeaders(revision)
    });
  },

  executeItemAction<T>(
    projectId: EntityId,
    section: OperationSectionRoute,
    itemId: EntityId,
    action: string,
    revision: number,
    body?: T
  ): Promise<OperationsSnapshot> {
    return requestJson<OperationsSnapshot>(buildOperationsPath(projectId, section, itemId, action), {
      method: 'POST', headers: writeHeaders(revision), body: JSON.stringify(body ?? {})
    });
  }
};
