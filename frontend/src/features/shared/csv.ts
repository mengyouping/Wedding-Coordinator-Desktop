import { createId } from '../../lib/id';
import type { Guest } from '../../types/domain';

function parseLine(line: string): string[] {
  const cells: string[] = [];
  let value = '';
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index] ?? '';
    if (char === '"' && quoted && line[index + 1] === '"') {
      value += '"';
      index += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === ',' && !quoted) {
      cells.push(value.trim());
      value = '';
    } else {
      value += char;
    }
  }
  cells.push(value.trim());
  return cells;
}

const escapeCell = (value: unknown): string => `"${String(value ?? '').replaceAll('"', '""')}"`;

export function parseGuestCsv(text: string): Guest[] {
  const lines = text.replace(/^\uFEFF/, '').split(/\r?\n/).filter(line => line.trim());
  if (lines.length < 2) return [];
  const headers = parseLine(lines[0] ?? '');
  const indexOf = (name: string) => headers.indexOf(name);
  const required = ['姓名', '归属', '关系组', '回执'];
  for (const header of required) if (indexOf(header) < 0) throw new Error(`CSV 缺少表头：${header}`);

  return lines.slice(1).map((line, rowIndex) => {
    const cells = parseLine(line);
    const read = (name: string) => cells[indexOf(name)]?.trim() ?? '';
    const companions = Number(read('携客人数') || 0);
    const children = Number(read('儿童人数') || 0);
    const side = read('归属');
    const rsvp = read('回执');
    if (!['男方', '女方', '共同'].includes(side)) throw new Error(`第 ${rowIndex + 2} 行归属非法`);
    if (!['已确认', '待回复', '不出席'].includes(rsvp)) throw new Error(`第 ${rowIndex + 2} 行回执非法`);
    return {
      id: createId('guest'),
      name: read('姓名'),
      householdName: read('家庭'),
      side: side as Guest['side'],
      group: read('关系组'),
      rsvp: rsvp as Guest['rsvp'],
      companions: Number.isFinite(companions) ? Math.max(0, companions) : 0,
      children: Number.isFinite(children) ? Math.max(0, children) : 0,
      phone: read('电话'),
      dietary: read('忌口'),
      transportNeed: read('交通需求'),
      accommodationNeed: read('住宿需求'),
      note: read('备注')
    } satisfies Guest;
  }).filter(guest => guest.name);
}

export function guestsToCsv(guests: Guest[]): string {
  const headers = ['姓名', '家庭', '归属', '关系组', '回执', '携客人数', '儿童人数', '电话', '忌口', '交通需求', '住宿需求', '备注'];
  const rows = guests.map(guest => [
    guest.name,
    guest.householdName ?? '',
    guest.side,
    guest.group,
    guest.rsvp,
    guest.companions,
    guest.children ?? 0,
    guest.phone,
    guest.dietary,
    guest.transportNeed ?? '',
    guest.accommodationNeed ?? '',
    guest.note
  ].map(escapeCell).join(','));
  return `\uFEFF${[headers.map(escapeCell).join(','), ...rows].join('\n')}`;
}
