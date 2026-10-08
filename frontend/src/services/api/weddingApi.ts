import { appConfig } from '../../config/appConfig';
import type { CollectionKey, ProjectSummary, WeddingCommand, WeddingDatabase } from '../../types/domain';
import { toEntityId, type EntityId, type RevisionValue } from '../../types/persistence';
import { requestJson } from '../http/httpClient';
import { parseDatabase } from '../persistence/jsonFileStore';

const collectionPaths: Record<CollectionKey, string> = {
  tasks: 'tasks',
  guests: 'guests',
  tables: 'tables',
  seatAssignments: 'seat-assignments',
  seatingPlans: 'seating-plans',
  vendors: 'vendors',
  timeline: 'timeline',
  invitations: 'invitations',
  risks: 'risks',
  materials: 'materials',
  members: 'members',
  attachments: 'attachments',
  quotes: 'quotes',
  contracts: 'contracts',
  transactions: 'transactions',
  runbookEvents: 'runbook-events',
  checkIns: 'check-ins',
  incidents: 'incidents'
};

export interface CommandRequest {
  path: string;
  init: RequestInit;
}

function projectPath(projectId: EntityId): string {
  return `/wedding/projects/${encodeURIComponent(toEntityId(projectId, '婚礼项目ID'))}`;
}

/**
 * 根据领域命令构造真实后端请求。
 * 项目ID按 VARCHAR(64) 字符串传输，Revision 按安全整数写入 If-Match。
 */
export function buildCommandRequest(
  projectId: EntityId,
  expectedRevision: RevisionValue,
  command: WeddingCommand
): CommandRequest {
  if (!Number.isSafeInteger(expectedRevision) || expectedRevision < 0) throw new Error('项目Revision必须是非负安全整数');
  const basePath = projectPath(projectId);
  let path: string;
  let body: unknown;
  switch (command.type) {
    case 'profile.replace':
      path = `${basePath}/profile`;
      body = command.payload;
      break;
    case 'settings.replace':
      path = `${basePath}/settings`;
      body = command.payload;
      break;
    case 'budget.replace':
      path = `${basePath}/budget`;
      body = command.payload;
      break;
    case 'collection.replace':
      path = `${basePath}/${collectionPaths[command.key]}`;
      body = command.payload;
      break;
    case 'snapshot.replace':
      path = `${basePath}/snapshot`;
      body = command.payload;
      break;
  }
  return {
    path,
    init: {
      method: 'PUT',
      headers: {
        'If-Match': String(expectedRevision),
        'Idempotency-Key': crypto.randomUUID()
      },
      body: JSON.stringify(body)
    }
  };
}

export const weddingApi = {
  listProjects(): Promise<ProjectSummary[]> {
    return requestJson<ProjectSummary[]>('/wedding/projects');
  },
  async createProject(projectName: string, cloneFromProjectId?: EntityId): Promise<WeddingDatabase> {
    const safeCloneFromProjectId = cloneFromProjectId ? toEntityId(cloneFromProjectId, '复制来源项目ID') : undefined;
    return parseDatabase(await requestJson<unknown>('/wedding/projects', {
      method: 'POST',
      headers: { 'Idempotency-Key': crypto.randomUUID() },
      body: JSON.stringify({ projectName, ...(safeCloneFromProjectId ? { cloneFromProjectId: safeCloneFromProjectId } : {}) })
    }));
  },
  async getSnapshot(projectId: EntityId = appConfig.defaultProjectId): Promise<WeddingDatabase> {
    return parseDatabase(await requestJson<unknown>(`${projectPath(projectId)}/snapshot`));
  },
  async commit(projectId: EntityId, expectedRevision: RevisionValue, command: WeddingCommand): Promise<WeddingDatabase> {
    const request = buildCommandRequest(projectId, expectedRevision, command);
    return parseDatabase(await requestJson<unknown>(request.path, request.init));
  },
  async resetSnapshot(projectId: EntityId): Promise<WeddingDatabase> {
    return parseDatabase(await requestJson<unknown>(`${projectPath(projectId)}/reset`, {
      method: 'POST',
      headers: { 'Idempotency-Key': crypto.randomUUID() }
    }));
  },
  async deleteProject(projectId: EntityId): Promise<void> {
    await requestJson<unknown>(projectPath(projectId), {
      method: 'DELETE',
      headers: { 'Idempotency-Key': crypto.randomUUID() }
    });
  }
};
