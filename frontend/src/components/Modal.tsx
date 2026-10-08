import { useEffect, useId, useRef, type KeyboardEvent, type ReactNode } from 'react';
import { Icon } from './Icon';

interface ModalProps {
  open: boolean;
  title: string;
  onClose(): void;
  children: ReactNode;
  footer: ReactNode;
}

const focusableSelector = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])'
].join(',');

export function Modal({ open, title, onClose, children, footer }: ModalProps) {
  const titleId = useId();
  const descriptionId = useId();
  const dialogRef = useRef<HTMLElement>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return undefined;
    restoreFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const timer = window.setTimeout(() => {
      const first = dialogRef.current?.querySelector<HTMLElement>(focusableSelector);
      (first ?? dialogRef.current)?.focus();
    }, 0);
    return () => {
      window.clearTimeout(timer);
      document.body.style.overflow = previousOverflow;
      restoreFocusRef.current?.focus();
    };
  }, [open]);

  if (!open) return null;

  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      onClose();
      return;
    }
    if (event.key !== 'Tab' || !dialogRef.current) return;
    const focusable = [...dialogRef.current.querySelectorAll<HTMLElement>(focusableSelector)];
    if (!focusable.length) {
      event.preventDefault();
      dialogRef.current.focus();
      return;
    }
    const first = focusable[0]!;
    const last = focusable[focusable.length - 1]!;
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  return <div
    className="modal-layer"
    role="presentation"
    onMouseDown={event => {
      if (event.target === event.currentTarget) onClose();
    }}
  >
    <section
      ref={dialogRef}
      className="modal panel"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      tabIndex={-1}
      onKeyDown={handleKeyDown}
    >
      <header>
        <div><h2 id={titleId}>{title}</h2><p id={descriptionId}>修改后将自动写入当前数据源</p></div>
        <button className="icon-button" aria-label={`关闭${title}弹窗`} onClick={onClose}><Icon name="close" /></button>
      </header>
      <div className="modal__body">{children}</div>
      <footer>{footer}</footer>
    </section>
  </div>;
}
