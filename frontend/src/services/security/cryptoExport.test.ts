import { describe, expect, it } from 'vitest';
import { decryptImport, encryptExport } from './cryptoExport';

describe('cryptoExport', () => {
  it('AES-GCM 加密后可使用同一密码恢复', async () => {
    const source = { projectId: 'w1', guests: [{ name: '测试宾客' }] };
    const encrypted = await encryptExport(source, 'wedding-2026');
    expect(encrypted).not.toContain('测试宾客');
    await expect(decryptImport<typeof source>(encrypted, 'wedding-2026')).resolves.toEqual(source);
  });

  it('错误密码不能解密', async () => {
    const encrypted = await encryptExport({ secret: true }, 'correct-password');
    await expect(decryptImport(encrypted, 'wrong-password')).rejects.toThrow('密码错误');
  });
});
