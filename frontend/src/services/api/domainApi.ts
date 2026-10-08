import type { WeddingDatabase } from '../../types/domain';
import { toEntityId, type EntityId } from '../../types/persistence';
import { requestJson } from '../http/httpClient';
import { domainRoutes, type DomainRoute } from './backendRoutes';

export { domainRoutes };

export function buildDomainPath(projectId: EntityId, domain: DomainRoute, itemId?: EntityId): string {
  const safeProjectId = toEntityId(projectId, '婚礼项目ID');
  if (!domainRoutes.includes(domain)) throw new Error(`未知业务领域：${domain}`);
  const base = `/wedding/projects/${encodeURIComponent(safeProjectId)}/${domain}`;
  if (itemId === undefined) return base;
  return `${base}/${encodeURIComponent(toEntityId(itemId, '业务实体ID'))}`;
}

function writeHeaders(revision: number): HeadersInit {
  if (!Number.isSafeInteger(revision) || revision < 1) throw new Error('Revision必须为正整数');
  return {
    'If-Match': String(revision),
    'Idempotency-Key': crypto.randomUUID()
  };
}

export const domainApi = {
  get<T>(projectId: EntityId, domain: DomainRoute): Promise<T> {
    return requestJson<T>(buildDomainPath(projectId, domain));
  },

  getItem<T>(projectId: EntityId, domain: DomainRoute, itemId: EntityId): Promise<T> {
    return requestJson<T>(buildDomainPath(projectId, domain, itemId));
  },

  replace<T>(projectId: EntityId, domain: DomainRoute, revision: number, payload: T): Promise<WeddingDatabase> {
    return requestJson<WeddingDatabase>(buildDomainPath(projectId, domain), {
      method: 'PUT',
      headers: writeHeaders(revision),
      body: JSON.stringify(payload)
    });
  },

  create<T>(projectId: EntityId, domain: DomainRoute, revision: number, payload: T): Promise<WeddingDatabase> {
    return requestJson<WeddingDatabase>(buildDomainPath(projectId, domain), {
      method: 'POST',
      headers: writeHeaders(revision),
      body: JSON.stringify(payload)
    });
  },

  patch<T>(projectId: EntityId, domain: DomainRoute, itemId: EntityId, revision: number, patch: Partial<T>): Promise<WeddingDatabase> {
    return requestJson<WeddingDatabase>(buildDomainPath(projectId, domain, itemId), {
      method: 'PATCH',
      headers: writeHeaders(revision),
      body: JSON.stringify(patch)
    });
  },

  remove(projectId: EntityId, domain: DomainRoute, itemId: EntityId, revision: number): Promise<WeddingDatabase> {
    return requestJson<WeddingDatabase>(buildDomainPath(projectId, domain, itemId), {
      method: 'DELETE',
      headers: writeHeaders(revision)
    });
  }
};
