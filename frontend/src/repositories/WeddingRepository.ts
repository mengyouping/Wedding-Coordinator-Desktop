import type { ProjectSummary, WeddingCommand, WeddingDatabase } from '../types/domain';
import type { EntityId, RevisionValue } from '../types/persistence';

/**
 * 婚礼数据仓库统一契约。
 * 项目ID对应数据库 VARCHAR(64)，Revision 对应 BIGINT 并限制为前端安全整数。
 */
export interface WeddingRepository {
  readonly mode: 'json' | 'api';
  readonly label: string;
  listProjects(): Promise<ProjectSummary[]>;
  createProject(projectName: string, cloneFromProjectId?: EntityId): Promise<WeddingDatabase>;
  load(projectId?: EntityId): Promise<WeddingDatabase>;
  commit(projectId: EntityId, expectedRevision: RevisionValue, command: WeddingCommand): Promise<WeddingDatabase>;
  reset(projectId: EntityId): Promise<WeddingDatabase>;
  deleteProject(projectId: EntityId): Promise<void>;
}
