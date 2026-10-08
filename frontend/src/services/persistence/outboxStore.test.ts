import { beforeEach, describe, expect, it } from 'vitest';
import { createOutboxCommand, listConflicts, listOutbox, resolveConflict, upsertConflict, upsertOutbox } from './outboxStore';

class MemoryStorage {
  private values = new Map<string, string>();
  getItem(key: string) { return this.values.get(key) ?? null; }
  setItem(key: string, value: string) { this.values.set(key, value); }
  removeItem(key: string) { this.values.delete(key); }
}

describe('outboxStore', () => {
  beforeEach(() => {
    Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: new MemoryStorage() });
    Object.defineProperty(globalThis, 'indexedDB', { configurable: true, value: undefined });
  });

  it('持久化待同步命令并按项目过滤', async () => {
    const command = createOutboxCommand('p1', 3, { type: 'profile.replace', payload: { groomName: '甲', brideName: '乙', weddingDate: '', ceremonyTime: '', banquetTime: '', venueName: '', venueAddress: '', coordinatorName: '', phone: '' } });
    await upsertOutbox(command);
    expect(await listOutbox('p1')).toEqual([command]);
    expect(await listOutbox('p2')).toEqual([]);
  });

  it('冲突处理状态可以持久化', async () => {
    const command = createOutboxCommand('p1', 3, { type: 'settings.replace', payload: { projectName: '测试', status: '筹备中', timezone: 'Asia/Shanghai', currency: 'CNY', locale: 'zh-CN', archived: false, autoLockMinutes: 15, maskSensitiveByDefault: true } });
    await upsertConflict({ id: 'c1', projectId: 'p1', localRevision: 4, command: command.command, fields: ['settings'], message: '409', status: '待处理', createdAt: new Date().toISOString() });
    await resolveConflict('c1', '采用服务端');
    expect((await listConflicts('p1'))[0]?.status).toBe('采用服务端');
  });
});
