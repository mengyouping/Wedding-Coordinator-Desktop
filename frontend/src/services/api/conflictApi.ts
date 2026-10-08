import type { ConflictRecord, OutboxCommand, WeddingDatabase } from '../../types/domain';
import { toEntityId, type EntityId } from '../../types/persistence';
import { requestJson } from '../http/httpClient';

function path(projectId: EntityId, suffix: string): string {
  return `/wedding/projects/${encodeURIComponent(toEntityId(projectId, '婚礼项目ID'))}/${suffix}`;
}

function headers(revision: number): HeadersInit {
  return { 'If-Match': String(revision), 'Idempotency-Key': crypto.randomUUID() };
}

export const conflictApi = {
  outbox(projectId: EntityId): Promise<OutboxCommand[]> {
    return requestJson<OutboxCommand[]>(path(projectId, 'outbox'));
  },
  conflicts(projectId: EntityId): Promise<ConflictRecord[]> {
    return requestJson<ConflictRecord[]>(path(projectId, 'conflicts'));
  },
  retry(projectId: EntityId, commandId: EntityId, revision: number): Promise<WeddingDatabase> {
    return requestJson<WeddingDatabase>(path(projectId, `outbox/${encodeURIComponent(toEntityId(commandId, '命令ID'))}/retry`), {
      method: 'POST', headers: headers(revision), body: JSON.stringify({})
    });
  },
  discard(projectId: EntityId, commandId: EntityId, revision: number): Promise<WeddingDatabase> {
    return requestJson<WeddingDatabase>(path(projectId, `outbox/${encodeURIComponent(toEntityId(commandId, '命令ID'))}`), {
      method: 'DELETE', headers: headers(revision)
    });
  },
  resolve(
    projectId: EntityId,
    conflictId: EntityId,
    revision: number,
    resolution: 'REAPPLY_LOCAL'|'USE_REMOTE'|'DISCARD',
    expectedRemoteRevision?: number
  ): Promise<WeddingDatabase> {
    return requestJson<WeddingDatabase>(path(projectId, `conflicts/${encodeURIComponent(toEntityId(conflictId, '冲突ID'))}/resolve`), {
      method: 'POST',
      headers: headers(revision),
      body: JSON.stringify({ resolution, expectedRemoteRevision })
    });
  }
};
