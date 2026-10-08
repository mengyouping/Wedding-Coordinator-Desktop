import type { WeddingDatabase } from '../../types/domain';
import { toEntityId, type EntityId } from '../../types/persistence';
import { requestJson } from '../http/httpClient';

function projectBase(projectId: EntityId): string {
  return `/wedding/projects/${encodeURIComponent(toEntityId(projectId, '婚礼项目ID'))}`;
}

function commandHeaders(revision: number): HeadersInit {
  if (!Number.isSafeInteger(revision) || revision < 1) throw new Error('Revision必须为正整数');
  return { 'If-Match': String(revision), 'Idempotency-Key': crypto.randomUUID() };
}

function post<T>(projectId: EntityId, path: string, revision: number, body?: T): Promise<WeddingDatabase> {
  return requestJson<WeddingDatabase>(`${projectBase(projectId)}${path}`, {
    method: 'POST',
    headers: commandHeaders(revision),
    body: JSON.stringify(body ?? {})
  });
}

export const businessCommandApi = {
  completeTask: (projectId: EntityId, taskId: EntityId, revision: number) =>
    post(projectId, `/tasks/${encodeURIComponent(toEntityId(taskId, '任务ID'))}/complete`, revision),
  reopenTask: (projectId: EntityId, taskId: EntityId, revision: number) =>
    post(projectId, `/tasks/${encodeURIComponent(toEntityId(taskId, '任务ID'))}/reopen`, revision),
  batchTasks: (projectId: EntityId, revision: number, body: unknown) => post(projectId, '/tasks/batch', revision, body),
  selectQuote: (projectId: EntityId, quoteId: EntityId, revision: number) =>
    post(projectId, `/quotes/${encodeURIComponent(toEntityId(quoteId, '报价ID'))}/select`, revision),
  activateContract: (projectId: EntityId, contractId: EntityId, revision: number) =>
    post(projectId, `/contracts/${encodeURIComponent(toEntityId(contractId, '合同ID'))}/activate`, revision),
  voidTransaction: (projectId: EntityId, transactionId: EntityId, revision: number, reason: string) =>
    post(projectId, `/transactions/${encodeURIComponent(toEntityId(transactionId, '资金流水ID'))}/void`, revision, { reason }),
  lockTable: (projectId: EntityId, tableId: EntityId, revision: number) =>
    post(projectId, `/tables/${encodeURIComponent(toEntityId(tableId, '桌位ID'))}/lock`, revision),
  unlockTable: (projectId: EntityId, tableId: EntityId, revision: number) =>
    post(projectId, `/tables/${encodeURIComponent(toEntityId(tableId, '桌位ID'))}/unlock`, revision),
  activateSeatingPlan: (projectId: EntityId, planId: EntityId, revision: number) =>
    post(projectId, `/seating-plans/${encodeURIComponent(toEntityId(planId, '排桌方案ID'))}/activate`, revision),
  regenerateInvitationToken: (projectId: EntityId, invitationId: EntityId, revision: number) =>
    post(projectId, `/invitations/${encodeURIComponent(toEntityId(invitationId, '请帖ID'))}/regenerate-token`, revision),
  setRiskMitigations: (projectId: EntityId, riskId: EntityId, revision: number, taskIds: EntityId[]) =>
    post(projectId, `/risks/${encodeURIComponent(toEntityId(riskId, '风险ID'))}/mitigations`, revision, { taskIds }),
  handoverMaterial: (projectId: EntityId, materialId: EntityId, revision: number, body: unknown) =>
    post(projectId, `/materials/${encodeURIComponent(toEntityId(materialId, '物料ID'))}/handover`, revision, body),
  returnMaterial: (projectId: EntityId, materialId: EntityId, revision: number, body: unknown) =>
    post(projectId, `/materials/${encodeURIComponent(toEntityId(materialId, '物料ID'))}/return`, revision, body),
  timelineAction: (projectId: EntityId, timelineId: EntityId, action: 'start'|'complete'|'skip'|'delay', revision: number, body?: unknown) =>
    post(projectId, `/timeline/${encodeURIComponent(toEntityId(timelineId, '流程ID'))}/${action}`, revision, body),
  autoPlanSeating(projectId: EntityId, revision: number, apply = false): Promise<WeddingDatabase> {
    const path = `${projectBase(projectId)}/seating/auto-plan?apply=${String(apply)}`;
    return requestJson<WeddingDatabase>(path, {
      method: 'POST',
      headers: apply ? commandHeaders(revision) : undefined,
      body: JSON.stringify({})
    });
  }
};
