import { describe, expect, it } from 'vitest';
import { buildCommandRequest } from './weddingApi';

const settingsCommand = {
  type: 'settings.replace' as const,
  payload: {
    projectName: '测试婚礼',
    status: '筹备中' as const,
    timezone: 'Asia/Shanghai',
    currency: 'CNY' as const,
    locale: 'zh-CN' as const,
    archived: false,
    autoLockMinutes: 30,
    maskSensitiveByDefault: true,
    activeSeatingPlanId: ''
  }
};

describe('婚礼API持久化字段契约', () => {
  it('项目ID作为字符串路径参数并将Revision写入If-Match', () => {
    const request = buildCommandRequest('project_20260728', 18, settingsCommand);
    expect(request.path).toBe('/wedding/projects/project_20260728/settings');
    expect(new Headers(request.init.headers).get('If-Match')).toBe('18');
  });

  it('项目ID会执行URL编码', () => {
    const request = buildCommandRequest('project/with space', 1, settingsCommand);
    expect(request.path).toBe('/wedding/projects/project%2Fwith%20space/settings');
  });

  it('拒绝空项目ID、超过VARCHAR(64)的项目ID和非法Revision', () => {
    expect(() => buildCommandRequest('  ', 1, settingsCommand)).toThrow(/项目ID不能为空/);
    expect(() => buildCommandRequest('项'.repeat(65), 1, settingsCommand)).toThrow(/不能超过64个字符/);
    expect(() => buildCommandRequest('project_1', -1, settingsCommand)).toThrow(/非负安全整数/);
    expect(() => buildCommandRequest('project_1', 1.5, settingsCommand)).toThrow(/非负安全整数/);
    expect(() => buildCommandRequest('project_1', Number.MAX_SAFE_INTEGER + 1, settingsCommand)).toThrow(/非负安全整数/);
  });
});
