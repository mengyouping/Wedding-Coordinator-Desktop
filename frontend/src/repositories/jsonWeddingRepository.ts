import type { WeddingCommand, WeddingDatabase } from '../types/domain';
import type { WeddingRepository } from './WeddingRepository';
import { deleteJsonSnapshot, loadJsonSnapshot, resetJsonSnapshot, saveJsonSnapshot } from '../services/persistence/jsonFileStore';
import { appendAudit, createAuditEntry } from '../services/audit/auditService';
import { createProjectId, listProjects } from '../services/projects/projectCatalog';
import { initialWeddingDatabase } from '../data/seed';
import { createEmptyWeddingDatabase } from '../data/createEmptyWeddingDatabase';
import { deleteProjectAttachments } from '../services/attachments/localAttachmentStore';

function applyCommand(current: WeddingDatabase, command: WeddingCommand): WeddingDatabase {
  switch (command.type) {
    case 'profile.replace':
      return { ...current, profile: structuredClone(command.payload) };
    case 'settings.replace':
      return { ...current, settings: structuredClone(command.payload) };
    case 'budget.replace':
      return { ...current, budget: structuredClone(command.payload) };
    case 'collection.replace':
      return { ...current, [command.key]: structuredClone(command.payload) } as WeddingDatabase;
    case 'snapshot.replace':
      return { ...structuredClone(command.payload), auditLogs: current.auditLogs };
  }
}

export const jsonWeddingRepository: WeddingRepository = {
  mode: 'json',
  label: '本地多项目数据库',
  async listProjects() {
    return listProjects();
  },
  async createProject(projectName, cloneFromProjectId) {
    const projectId = createProjectId(projectName);
    if (!cloneFromProjectId) {
      const owner = initialWeddingDatabase.members.find(item => item.role === '所有者') ?? {
        id: 'member-owner', name: '本地所有者', email: '', role: '所有者' as const, active: true
      };
      return saveJsonSnapshot(createEmptyWeddingDatabase(initialWeddingDatabase, projectId, projectName, owner));
    }

    const source = await loadJsonSnapshot(cloneFromProjectId);
    const created: WeddingDatabase = {
      ...structuredClone(source),
      projectId,
      schemaVersion: 4,
      revision: 1,
      updatedAt: new Date().toISOString(),
      settings: {
        ...source.settings,
        projectName: projectName.trim() || `${source.settings.projectName}副本`,
        status: '筹备中',
        archived: false
      },
      conflicts: [],
      outbox: [],
      auditLogs: []
    };
    return saveJsonSnapshot(created);
  },
  load: projectId => loadJsonSnapshot(projectId),
  async commit(projectId, expectedRevision, command) {
    const current = await loadJsonSnapshot(projectId);
    if (current.projectId !== projectId) throw new Error(`当前项目与保存项目不一致：${projectId}`);
    if (current.revision !== expectedRevision) throw new Error(`VERSION_CONFLICT：期望版本 ${expectedRevision}，当前版本 ${current.revision}`);
    const changed = applyCommand(current, command);
    const next: WeddingDatabase = {
      ...changed,
      projectId,
      schemaVersion: 4,
      revision: expectedRevision + 1,
      updatedAt: new Date().toISOString()
    };
    return saveJsonSnapshot(appendAudit(next, createAuditEntry(current, command)));
  },
  reset: projectId => resetJsonSnapshot(projectId),
  async deleteProject(projectId) {
    await deleteProjectAttachments(projectId);
    await deleteJsonSnapshot(projectId);
  }
};
