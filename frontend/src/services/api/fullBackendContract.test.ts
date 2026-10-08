import { describe, expect, it } from 'vitest';
import { backendRouteTemplates, domainRoutes, operationSectionRoutes } from './backendRoutes';
import { buildDomainPath } from './domainApi';
import { buildOperationsPath } from './operationsApi';

describe('frontend to backend route contract', () => {
  it('声明的后端路由模板唯一且覆盖全部业务模块', () => {
    expect(backendRouteTemplates.length).toBeGreaterThan(60);
    expect(new Set(backendRouteTemplates).size).toBe(backendRouteTemplates.length);
    expect(backendRouteTemplates.every(path => path.startsWith('/'))).toBe(true);
    for (const required of [
      '/auth/login-url', '/wedding/projects', '/wedding/projects/{projectId}/snapshot',
      '/wedding/projects/{projectId}/dashboard', '/wedding/projects/{projectId}/war-room',
      '/public/invitations/{token}', '/wedding/projects/{projectId}/operations'
    ]) expect(backendRouteTemplates).toContain(required);
  });

  it('领域路径和婚礼全案路径会校验并编码实体ID', () => {
    expect(buildDomainPath('project 1', 'seat-assignments', 'seat/1'))
      .toBe('/wedding/projects/project%201/seat-assignments/seat%2F1');
    expect(buildOperationsPath('project 1', 'banquet-menus', 'menu/1'))
      .toBe('/wedding/projects/project%201/banquet-menus/menu%2F1');
    expect(domainRoutes).toContain('transactions');
    expect(operationSectionRoutes).toContain('emergency-plans');
  });
});
