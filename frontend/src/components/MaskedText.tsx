import { useState } from 'react';

export function maskPhone(value: string): string {
  const trimmed = value.trim();
  if (trimmed.length < 7) return trimmed ? '***' : '';
  return `${trimmed.slice(0, 3)}****${trimmed.slice(-4)}`;
}

export function MaskedText({ value, label = '敏感信息', masked = true }: { value: string; label?: string; masked?: boolean }) {
  const [revealed, setRevealed] = useState(false);
  if (!value) return <span>-</span>;
  return <span className="masked-text"><span>{masked && !revealed ? maskPhone(value) : value}</span>{masked && <button type="button" onClick={() => setRevealed(current => !current)} aria-label={`${revealed ? '隐藏' : '查看'}${label}`}>{revealed ? '隐藏' : '查看'}</button>}</span>;
}
