import type { WeddingDatabase } from '../../types/domain';

export function assertProjectGovernanceInvariants(database: WeddingDatabase): void {
  const activeOwners = database.members.filter(member => member.role === '所有者' && member.active);
  if (!activeOwners.length) throw new Error('项目至少保留一名启用的所有者');

  const memberIds = new Set<string>();
  for (const member of database.members) {
    if (memberIds.has(member.id)) throw new Error(`项目成员 ID 重复：${member.id}`);
    memberIds.add(member.id);
  }
}