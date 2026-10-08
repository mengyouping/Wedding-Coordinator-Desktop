import type { WeddingRepository } from './WeddingRepository';
import { weddingApi } from '../services/api/weddingApi';

export const httpWeddingRepository: WeddingRepository = {
  mode: 'api',
  label: '真实后端 API',
  listProjects: () => weddingApi.listProjects(),
  createProject: (projectName, cloneFromProjectId) => weddingApi.createProject(projectName, cloneFromProjectId),
  load: projectId => weddingApi.getSnapshot(projectId),
  commit: (projectId, expectedRevision, command) => weddingApi.commit(projectId, expectedRevision, command),
  reset: projectId => weddingApi.resetSnapshot(projectId),
  deleteProject: projectId => weddingApi.deleteProject(projectId)
};
