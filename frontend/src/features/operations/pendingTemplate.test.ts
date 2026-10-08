import { describe, expect, it } from 'vitest';
import {
  consumePendingOperationsTemplate,
  pendingOperationsTemplateKey,
  storePendingOperationsTemplate
} from './pendingTemplate';

function memoryStorage() {
  const values = new Map<string, string>();
  return {
    getItem(key: string) { return values.get(key) ?? null; },
    setItem(key: string, value: string) { values.set(key, value); },
    removeItem(key: string) { values.delete(key); }
  };
}

describe('婚礼全案待应用模板', () => {
  it('按项目生成互不相同的存储键', () => {
    expect(pendingOperationsTemplateKey('project-a')).not.toBe(pendingOperationsTemplateKey('project-b'));
  });

  it('消费一个项目的模板不会污染其他项目', () => {
    const storage = memoryStorage();
    storePendingOperationsTemplate(storage, 'project-a', 'church');
    storePendingOperationsTemplate(storage, 'project-b', 'outdoor-lawn');

    expect(consumePendingOperationsTemplate(storage, 'project-a')).toBe('church');
    expect(consumePendingOperationsTemplate(storage, 'project-a')).toBeNull();
    expect(consumePendingOperationsTemplate(storage, 'project-b')).toBe('outdoor-lawn');
  });
});