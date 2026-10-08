import type { OperationsStatus } from '../model';

const statuses: OperationsStatus[] = ['待确认', '进行中', '已确认', '已完成', '有风险'];

export function StatusSelect({ value, onChange, compact = false }: { value: OperationsStatus; onChange(value: OperationsStatus): void; compact?: boolean }) {
  return <select className={`operations-status operations-status--${value} ${compact ? 'is-compact' : ''}`} value={value} onChange={event => onChange(event.target.value as OperationsStatus)}>{statuses.map(status => <option key={status}>{status}</option>)}</select>;
}

export { statuses as operationsStatuses };
