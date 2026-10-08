import { beforeEach, describe, expect, it } from 'vitest';
import { initialWeddingDatabase } from '../../data/seed';
import { migrateDatabase } from '../persistence/migrations';
import { createProjectId, getActiveProjectId, listProjects, setActiveProjectId, upsertProjectSummary } from './projectCatalog';

class MemoryStorage {
  private values = new Map<string, string>();
  getItem(key: string) { return this.values.get(key) ?? null; }
  setItem(key: string, value: string) { this.values.set(key, value); }
  removeItem(key: string) { this.values.delete(key); }
  clear() { this.values.clear(); }
}

describe('projectCatalog', () => {
  beforeEach(() => {
    Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: new MemoryStorage() });
  });

  it('写入项目摘要并记录当前项目', () => {
    const database = migrateDatabase(initialWeddingDatabase);
    upsertProjectSummary(database);
    setActiveProjectId(database.projectId);
    expect(listProjects()).toHaveLength(1);
    expect(getActiveProjectId()).toBe(database.projectId);
  });

  it('生成可读且唯一的项目 ID', () => {
    expect(createProjectId('孟先生 与 林小姐')).toMatch(/^孟先生-与-林小姐-/);
  });
});
