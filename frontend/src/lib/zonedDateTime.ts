function partsAt(epoch: number, timeZone: string): Record<'year' | 'month' | 'day' | 'hour' | 'minute' | 'second', number> {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23'
  });
  const parts = formatter.formatToParts(new Date(epoch));
  const read = (type: Intl.DateTimeFormatPartTypes): number => Number(parts.find(part => part.type === type)?.value ?? 0);
  return {
    year: read('year'),
    month: read('month'),
    day: read('day'),
    hour: read('hour'),
    minute: read('minute'),
    second: read('second')
  };
}

/** 把项目时区中的当地日期时间转换为 UTC epoch。 */
export function zonedDateTimeToEpoch(date: string, time: string, timeZone: string): number {
  const day = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  const clock = /^(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(time || '00:00');
  if (!day || !clock) return Number.NaN;

  const desiredUtc = Date.UTC(
    Number(day[1]),
    Number(day[2]) - 1,
    Number(day[3]),
    Number(clock[1]),
    Number(clock[2]),
    Number(clock[3] ?? 0)
  );
  let candidate = desiredUtc;

  // 通过 Intl 反推目标时区偏移；迭代可覆盖夏令时边界。
  for (let index = 0; index < 3; index += 1) {
    const rendered = partsAt(candidate, timeZone);
    const renderedUtc = Date.UTC(
      rendered.year,
      rendered.month - 1,
      rendered.day,
      rendered.hour,
      rendered.minute,
      rendered.second
    );
    const delta = desiredUtc - renderedUtc;
    candidate += delta;
    if (delta === 0) break;
  }
  return candidate;
}
