import type { WeddingDatabase } from '../../types/domain';

/** 只允许同一项目且 revision 不倒退的保存结果回写当前界面。 */
export function acceptProjectSnapshot(
  current: WeddingDatabase | null,
  saved: WeddingDatabase
): WeddingDatabase {
  if (!current) return saved;
  if (current.projectId !== saved.projectId) return current;
  return saved.revision >= current.revision ? saved : current;
}
