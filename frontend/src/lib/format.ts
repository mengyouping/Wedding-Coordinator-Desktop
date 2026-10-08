export const currency = new Intl.NumberFormat('zh-CN',{style:'currency',currency:'CNY',maximumFractionDigits:0});
export const number = new Intl.NumberFormat('zh-CN');
export function formatDate(value: string): string { if (!value) return '未设置'; const date = new Date(`${value}T00:00:00`); return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat('zh-CN',{month:'short',day:'numeric'}).format(date); }
export function daysUntil(value: string): number { const target = new Date(`${value}T00:00:00`).getTime(); return Math.max(0,Math.ceil((target-Date.now())/86400000)); }
