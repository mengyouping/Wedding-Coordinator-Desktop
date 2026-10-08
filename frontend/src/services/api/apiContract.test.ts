import fs from 'node:fs';
import { describe, expect, it } from 'vitest';

const openapi = fs.readFileSync(new URL('../../../../contracts/openapi.yaml', import.meta.url), 'utf8');

describe('OpenAPI production contract', () => {
  it('不再使用无类型GenericCollection', () => {
    expect(openapi).not.toContain('GenericCollection');
    expect(openapi).not.toMatch(/items:\s*\{\s*\}/);
  });

  it('每个operationId唯一', () => {
    const operationIds = [...openapi.matchAll(/operationId:\s*([A-Za-z0-9_]+)/g)].map(match => match[1]);
    expect(operationIds.length).toBeGreaterThan(20);
    expect(new Set(operationIds).size).toBe(operationIds.length);
  });

  it('包含冲突详情与附件下载契约', () => {
    expect(openapi).toContain('ConflictDetail:');
    expect(openapi).toContain('remoteRevision:');
    expect(openapi).toContain('/wedding/projects/{projectId}/attachments/{attachmentId}/download:');
  });
});
