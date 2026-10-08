import type { ReactNode } from 'react';

export interface OperationsMetric {
  label: string;
  value: string | number;
  detail: string;
  tone?: 'normal' | 'warning' | 'danger' | 'success';
  icon?: ReactNode;
}

export function OperationsSummary({ metrics }: { metrics: OperationsMetric[] }) {
  return <section className="operations-summary">{metrics.map(metric => <article className={`panel operations-metric is-${metric.tone ?? 'normal'}`} key={metric.label}>{metric.icon && <span>{metric.icon}</span>}<div><small>{metric.label}</small><strong>{metric.value}</strong><p>{metric.detail}</p></div></article>)}</section>;
}
