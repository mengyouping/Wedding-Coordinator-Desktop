import { describe, expect, it } from 'vitest';
import { initialWeddingDatabase } from '../../data/seed';
import { assertProjectGovernanceInvariants } from './projectGovernance';

describe('项目成员治理约束', () => {
  it('禁止停用项目最后一个所有者', () => {
    const next = structuredClone(initialWeddingDatabase);
    next.members = next.members.map(member => member.role === '所有者' ? { ...member, active: false } : member);
    expect(() => assertProjectGovernanceInvariants(next)).toThrow(/至少保留一名启用的所有者/);
  });

  it('同一次原子变更完成所有者交接后允许停用原所有者', () => {
    const next = structuredClone(initialWeddingDatabase);
    next.members = next.members.map((member, index) => index === 0
      ? { ...member, active: false }
      : index === 1
        ? { ...member, role: '所有者', active: true }
        : member);
    expect(() => assertProjectGovernanceInvariants(next)).not.toThrow();
  });
});