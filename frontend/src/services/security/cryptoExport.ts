const FORMAT = 'wedding-os-encrypted-v1';
const ITERATIONS = 210_000;

export interface EncryptedExportEnvelope {
  format: typeof FORMAT;
  algorithm: 'AES-GCM';
  iterations: number;
  salt: string;
  iv: string;
  ciphertext: string;
  createdAt: string;
}

function toBase64(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function fromBase64(value: string): Uint8Array {
  const binary = atob(value);
  return Uint8Array.from(binary, char => char.charCodeAt(0));
}

async function deriveKey(password: string, salt: Uint8Array, iterations: number): Promise<CryptoKey> {
  if (password.length < 8) throw new Error('导出密码至少需要 8 位');
  const material = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations, hash: 'SHA-256' },
    material,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

export async function encryptExport(value: unknown, password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(password, salt, ITERATIONS);
  const plaintext = new TextEncoder().encode(JSON.stringify(value));
  const ciphertext = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, plaintext));
  const envelope: EncryptedExportEnvelope = {
    format: FORMAT,
    algorithm: 'AES-GCM',
    iterations: ITERATIONS,
    salt: toBase64(salt),
    iv: toBase64(iv),
    ciphertext: toBase64(ciphertext),
    createdAt: new Date().toISOString()
  };
  return JSON.stringify(envelope, null, 2);
}

export async function decryptImport<T>(text: string, password: string): Promise<T> {
  let envelope: EncryptedExportEnvelope;
  try { envelope = JSON.parse(text) as EncryptedExportEnvelope; } catch { throw new Error('加密备份不是有效 JSON'); }
  if (envelope.format !== FORMAT || envelope.algorithm !== 'AES-GCM') throw new Error('不支持的加密备份格式');
  try {
    const salt = fromBase64(envelope.salt);
    const iv = fromBase64(envelope.iv);
    const key = await deriveKey(password, salt, envelope.iterations);
    const plaintext = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, fromBase64(envelope.ciphertext));
    return JSON.parse(new TextDecoder().decode(plaintext)) as T;
  } catch (error) {
    if (error instanceof Error && error.message.includes('至少需要')) throw error;
    throw new Error('密码错误或备份文件已损坏');
  }
}
