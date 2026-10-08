import { describe, expect, it } from 'vitest';
import type { WeddingDatabase } from '../../types/domain';
import { acceptProjectSnapshot } from './projectSnapshotGuard';

const snapshot = (projectId: string, revision: number) => ({ projectId, revision }) as unknown as WeddingDatabase;

describe('acceptProjectSnapshot', () => {
  it('拒绝其他项目的异步保存结果', () => {
    const current = snapshot('project-b', 1);
    expect(acceptProjectSnapshot(current, snapshot('project-a', 99))).toBe(current);
  });

  it('接受同项目更高revision结果', () => {
    const saved = snapshot('project-a', 2);
    expect(acceptProjectSnapshot(snapshot('project-a', 1), saved)).toBe(saved);
  });

  it('拒绝同项目旧revision结果', () => {
    const current = snapshot('project-a', 5);
    expect(acceptProjectSnapshot(current, snapshot('project-a', 4))).toBe(current);
  });
});
