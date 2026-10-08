import type { ProjectSummary, WeddingDatabase } from '../../types/domain';
import type { EntityId } from '../../types/persistence';
import { weddingApi } from './weddingApi';

/** 项目中心 API；保留 weddingApi 作为旧 Repository 兼容导出。 */
export const projectApi = {
  list(): Promise<ProjectSummary[]> {
    return weddingApi.listProjects();
  },
  create(projectName: string, cloneFromProjectId?: EntityId): Promise<WeddingDatabase> {
    return weddingApi.createProject(projectName, cloneFromProjectId);
  },
  snapshot(projectId: EntityId): Promise<WeddingDatabase> {
    return weddingApi.getSnapshot(projectId);
  },
  reset(projectId: EntityId): Promise<WeddingDatabase> {
    return weddingApi.resetSnapshot(projectId);
  },
  remove(projectId: EntityId): Promise<void> {
    return weddingApi.deleteProject(projectId);
  }
};
