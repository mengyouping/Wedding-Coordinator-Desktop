import { useState } from 'react';
import { Icon } from '../../../components/Icon';
import type { WeddingTemplateId } from '../model';
import { weddingTemplatePacks } from '../templatePacks';

export function TemplateSwitcher({ active, onApply, disabled = false }: {
  active: WeddingTemplateId;
  onApply(id: WeddingTemplateId): void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const selected = weddingTemplatePacks.find(item => item.id === active) ?? weddingTemplatePacks[0]!;
  const apply = (id: WeddingTemplateId) => {
    if (disabled) return;
    if (id === active) { setOpen(false); return; }
    if (!window.confirm('应用新的婚礼类型模板会覆盖当前“婚礼全案”前端草案，但不会影响预算、宾客、合同和财务数据。确认继续吗？')) return;
    onApply(id);
    setOpen(false);
  };

  return <div className="operations-template-switcher">
    <button className="button button--ghost" disabled={disabled} onClick={() => setOpen(value => !value)} aria-expanded={open}><Icon name="sparkles" /><span>{selected.shortName}</span></button>
    {open && <section className="panel operations-template-popover"><header><div><span className="eyebrow">WEDDING TEMPLATE PACKS</span><h2>婚礼类型模板</h2><p>通用业务结构保持不变，模板只替换八中心的默认内容。</p></div><button className="icon-button" aria-label="关闭" onClick={() => setOpen(false)}><Icon name="close" /></button></header><div className="operations-template-grid">{weddingTemplatePacks.map(item => <button disabled={disabled} key={item.id} className={item.id === active ? 'is-active' : ''} onClick={() => apply(item.id)}><i data-accent={item.accent}>{item.shortName.slice(0, 1)}</i><span><strong>{item.name}</strong><small>{item.description}</small><em>{item.scenes.join(' · ')}</em></span>{item.id === active && <b>当前模板</b>}</button>)}</div></section>}
  </div>;
}
