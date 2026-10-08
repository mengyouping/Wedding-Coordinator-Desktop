import { useRef, type PointerEvent as ReactPointerEvent } from 'react';
import type { VenueDeployment } from '../model';

interface DragState {
  id: string;
  startClientX: number;
  startClientY: number;
  startX: number;
  startY: number;
}

export function VenueDeploymentCanvas({ rows, selectedId, onSelect, onChange }: {
  rows: VenueDeployment[];
  selectedId: string;
  onSelect(id: string): void;
  onChange(rows: VenueDeployment[]): void;
}) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<DragState | null>(null);

  const startDrag = (event: ReactPointerEvent<HTMLButtonElement>, row: VenueDeployment) => {
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = { id: row.id, startClientX: event.clientX, startClientY: event.clientY, startX: row.x, startY: row.y };
    onSelect(row.id);
  };

  const moveDrag = (event: ReactPointerEvent<HTMLButtonElement>) => {
    const drag = dragRef.current;
    const canvas = canvasRef.current;
    if (!drag || !canvas || drag.id !== event.currentTarget.dataset.id) return;
    const row = rows.find(item => item.id === drag.id);
    if (!row) return;
    const bounds = canvas.getBoundingClientRect();
    const deltaX = (event.clientX - drag.startClientX) / bounds.width * 100;
    const deltaY = (event.clientY - drag.startClientY) / bounds.height * 100;
    const x = Math.max(0, Math.min(100 - row.width, drag.startX + deltaX));
    const y = Math.max(0, Math.min(100 - row.height, drag.startY + deltaY));
    onChange(rows.map(item => item.id === row.id ? { ...item, x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10 } : item));
  };

  const stopDrag = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    dragRef.current = null;
  };

  return <div className="venue-canvas" ref={canvasRef} aria-label="婚礼场地部署地图">
    <div className="venue-canvas__grid" />
    {rows.map(row => <button
      key={row.id}
      data-id={row.id}
      className={`venue-object is-${row.category} ${row.id === selectedId ? 'is-selected' : ''} ${row.status === '有风险' ? 'is-risk' : ''}`}
      style={{ left: `${row.x}%`, top: `${row.y}%`, width: `${row.width}%`, height: `${row.height}%`, transform: `rotate(${row.rotation}deg)` }}
      onPointerDown={event => startDrag(event, row)}
      onPointerMove={moveDrag}
      onPointerUp={stopDrag}
      onPointerCancel={stopDrag}
      title={`${row.name} · ${row.zone} · ${row.note}`}
    ><strong>{row.name}</strong><small>{row.category}</small>{row.fireAccess && <em>通道</em>}</button>)}
  </div>;
}
