import type { ReactNode } from 'react';
import { Icon } from '../../../components/Icon';

export interface OperationsColumn<T extends { id: string }> {
  key: keyof T & string;
  label: string;
  type?: 'text' | 'number' | 'date' | 'time' | 'textarea' | 'select' | 'boolean';
  options?: string[];
  width?: number;
  readOnly?: boolean;
  render?: (row: T) => ReactNode;
}

export function EditableOperationsTable<T extends { id: string }>({
  rows, columns, onPatch, onAdd, onDuplicate, onRemove, emptyText = '暂无记录'
}: {
  rows: T[];
  columns: Array<OperationsColumn<T>>;
  onPatch(id: string, patch: Partial<T>): void;
  onAdd(): void;
  onDuplicate(row: T): void;
  onRemove(id: string): void;
  emptyText?: string;
}) {
  return <div className="operations-table-wrap">
    <table className="data-table operations-table">
      <thead><tr>{columns.map(column => <th key={column.key} style={column.width ? { minWidth: column.width } : undefined}>{column.label}</th>)}<th className="operations-table__actions">操作</th></tr></thead>
      <tbody>{rows.length ? rows.map(row => <tr key={row.id}>{columns.map(column => {
        const value = row[column.key];
        return <td key={column.key}>{column.render ? column.render(row) : column.type === 'textarea'
          ? <textarea value={String(value ?? '')} readOnly={column.readOnly} onChange={event => onPatch(row.id, { [column.key]: event.target.value } as Partial<T>)} />
          : column.type === 'select'
            ? <select value={String(value ?? '')} disabled={column.readOnly} onChange={event => onPatch(row.id, { [column.key]: event.target.value } as Partial<T>)}>{(column.options ?? []).map(option => <option key={option}>{option}</option>)}</select>
            : column.type === 'boolean'
              ? <label className="operations-check"><input type="checkbox" checked={Boolean(value)} disabled={column.readOnly} onChange={event => onPatch(row.id, { [column.key]: event.target.checked } as Partial<T>)} /><span>{Boolean(value) ? '是' : '否'}</span></label>
              : <input
                  type={column.type === 'number' ? 'number' : column.type === 'date' ? 'date' : column.type === 'time' ? 'time' : 'text'}
                  min={column.type === 'number' ? 0 : undefined}
                  value={String(value ?? '')}
                  readOnly={column.readOnly}
                  onChange={event => onPatch(row.id, { [column.key]: column.type === 'number' ? Number(event.target.value) : event.target.value } as Partial<T>)}
                />}</td>;
      })}<td><div className="operations-row-actions"><button className="icon-button" title="复制" onClick={() => onDuplicate(row)}><Icon name="copy" /></button><button className="icon-button icon-button--danger" title="删除" onClick={() => onRemove(row.id)}><Icon name="trash" /></button></div></td></tr>) : <tr><td colSpan={columns.length + 1}><div className="operations-empty">{emptyText}</div></td></tr>}</tbody>
    </table>
    <button className="button button--ghost operations-table-add" onClick={onAdd}><Icon name="plus" />新增一行</button>
  </div>;
}
