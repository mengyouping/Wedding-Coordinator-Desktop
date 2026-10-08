import { useState } from 'react';
import { Icon } from '../../components/Icon';
import { LoadingState } from '../../components/LoadingState';
import { Modal } from '../../components/Modal';
import { PageHeader } from '../../components/PageHeader';
import { currency } from '../../lib/format';
import { createId } from '../../lib/id';
import { useWeddingData } from '../../state/WeddingDataProvider';
import type { InvoiceStatus, PaymentStatus, RiskLevel, Vendor, VendorStatus } from '../../types/domain';
import { applyFinancialProjection } from '../finance/financialProjection';
import { vendorDeletionBlockers } from './vendorDeletion';

const blank = (): Vendor => ({
  id: createId('vendor'), name: '', category: '其他', contactName: '', phone: '', contractAmount: 0,
  paidAmount: 0, nextPaymentDate: '', status: '待询价', rating: 5, riskLevel: '低', note: '', payments: [], deliverables: []
});

export function VendorsPage() {
  const { data, loading, updateDatabase, can } = useWeddingData();
  const [editing, setEditing] = useState<Vendor | null>(null);
  const [notice, setNotice] = useState('');
  if (loading || !data) return <LoadingState />;
  const writable = can('budget.write');

  const financialData = applyFinancialProjection(data);
  const totalContract = financialData.vendors.reduce((sum, vendor) => sum + vendor.contractAmount, 0);
  const totalPaid = financialData.vendors.reduce((sum, vendor) => sum + vendor.paidAmount, 0);
  const overduePayments = financialData.vendors.flatMap(vendor => vendor.payments ?? []).filter(payment => payment.status !== '已支付' && payment.dueDate && payment.dueDate < new Date().toISOString().slice(0, 10)).length;

  const save = () => {
    if (!writable || !editing?.name.trim()) return;
    const nextPaymentDate = (editing.payments ?? [])
      .filter(payment => payment.status === '待支付')
      .map(payment => payment.dueDate)
      .filter(Boolean)
      .sort()[0] ?? '';
    updateDatabase(database => applyFinancialProjection({
      ...database,
      vendors: database.vendors.some(vendor => vendor.id === editing.id)
        ? database.vendors.map(vendor => vendor.id === editing.id ? { ...editing, nextPaymentDate } : vendor)
        : [...database.vendors, { ...editing, nextPaymentDate }]
    }));
    setEditing(null);
  };

  const removeVendor = (vendorId: string) => {
    if (!writable) return;
    const blockers = vendorDeletionBlockers(financialData, vendorId);
    if (blockers.length) {
      setNotice(`不能删除供应商：仍关联 ${blockers.join('、')}。请保留供应商档案，或先按业务流程完成归档与冲销。`);
      return;
    }
    const vendorName = financialData.vendors.find(item => item.id === vendorId)?.name ?? '该供应商';
    if (!window.confirm(`确认删除“${vendorName}”吗？该供应商当前没有报价、合同或资金流水引用。`)) return;
    updateDatabase(database => applyFinancialProjection({
      ...database,
      vendors: database.vendors.filter(item => item.id !== vendorId)
    }));
    setEditing(null);
    setNotice(`供应商“${vendorName}”已删除。`);
  };

  const addPayment = () => {
    if (!editing || !writable) return;
    setEditing({ ...editing, payments: [...(editing.payments ?? []), { id: createId('payment'), title: '计划付款节点', amount: 0, dueDate: '', status: '待支付', invoiceStatus: '未开票' }] });
  };

  return <div className="page">
    <PageHeader eyebrow="VENDOR GOVERNANCE" title="供应商与合同" description="付款节点只表示计划；实际已付款统一读取财务流水，避免供应商、预算和财务页面金额不一致。" actions={<button className="button" disabled={!writable} onClick={() => setEditing(blank())}><Icon name="plus" />新增供应商</button>} />
    {notice && <div className="global-alert" role={notice.startsWith('不能') ? 'alert' : 'status'}><Icon name={notice.startsWith('不能') ? 'warning' : 'check'} /><span>{notice}</span><button onClick={() => setNotice('')}>关闭</button></div>}
    <section className="stats-grid"><article className="metric panel"><span>合同总额</span><strong>{currency.format(totalContract)}</strong><small>由合同台账汇总</small></article><article className="metric panel"><span>实际已付款</span><strong>{currency.format(totalPaid)}</strong><small>由财务流水汇总</small></article><article className="metric panel"><span>待付款</span><strong>{currency.format(Math.max(0, totalContract - totalPaid))}</strong><small>现金流预留</small></article><article className="metric panel"><span>逾期计划节点</span><strong>{overduePayments}</strong><small>需要立即跟进</small></article></section>
    <section className="vendor-grid">{financialData.vendors.map(vendor => <article className="vendor-card panel interactive-card" key={vendor.id}>
      <header><div><span>{vendor.category}</span><h2>{vendor.name}</h2></div><button className="icon-button" disabled={!writable} aria-label={`编辑供应商 ${vendor.name}`} onClick={() => setEditing(vendor)}><Icon name="edit" /></button></header>
      <div className="vendor-score"><b>{vendor.rating.toFixed(1)}</b><span>★ 履约评分</span><em className={`risk-label risk-label--${vendor.riskLevel}`}>{vendor.riskLevel}风险</em></div>
      <dl><div><dt>联系人</dt><dd>{vendor.contactName} · {vendor.phone}</dd></div><div><dt>合同金额</dt><dd>{currency.format(vendor.contractAmount)}</dd></div><div><dt>实际已付</dt><dd>{currency.format(vendor.paidAmount)}</dd></div><div><dt>下次计划付款</dt><dd>{vendor.nextPaymentDate || '未设置'}</dd></div></dl>
      <div className="payment-mini-list">{(vendor.payments ?? []).slice(0, 3).map(payment => <span key={payment.id}><b>{payment.title}</b><small>{payment.dueDate || '未定'} · {payment.status}</small><em>{currency.format(payment.amount)}</em></span>)}</div>
      <footer><span>{vendor.status}</span><small>{vendor.note}</small></footer>
    </article>)}</section>
    <Modal open={Boolean(editing)} title="供应商档案" onClose={() => setEditing(null)} footer={<><button className="button button--ghost" onClick={() => setEditing(null)}>取消</button>{editing && financialData.vendors.some(vendor => vendor.id === editing.id) && <button className="button button--danger" disabled={!writable} onClick={() => removeVendor(editing.id)}>删除</button>}<button className="button" disabled={!writable} onClick={save}>保存</button></>}>
      {editing && <fieldset disabled={!writable} className="form-grid operations-form-fieldset">
        <label><span>供应商名称</span><input value={editing.name} onChange={event => setEditing({ ...editing, name: event.target.value })} /></label>
        <label><span>分类</span><input value={editing.category} onChange={event => setEditing({ ...editing, category: event.target.value })} /></label>
        <label><span>联系人</span><input value={editing.contactName} onChange={event => setEditing({ ...editing, contactName: event.target.value })} /></label>
        <label><span>电话</span><input value={editing.phone} onChange={event => setEditing({ ...editing, phone: event.target.value })} /></label>
        <label><span>合同金额（自动汇总）</span><input type="number" value={editing.contractAmount} readOnly /></label>
        <label><span>实际已付款（自动汇总）</span><input type="number" value={editing.paidAmount} readOnly /></label>
        <label><span>履约状态</span><select value={editing.status} onChange={event => setEditing({ ...editing, status: event.target.value as VendorStatus })}>{['待询价', '待签约', '执行中', '已完成'].map(value => <option key={value}>{value}</option>)}</select></label>
        <label><span>评分</span><input type="number" min="0" max="5" step="0.1" value={editing.rating} onChange={event => setEditing({ ...editing, rating: Math.max(0, Math.min(5, Number(event.target.value))) })} /></label>
        <label><span>风险</span><select value={editing.riskLevel} onChange={event => setEditing({ ...editing, riskLevel: event.target.value as RiskLevel })}><option>低</option><option>中</option><option>高</option></select></label>
        <label className="form-wide"><span>交付物（每行一项）</span><textarea value={(editing.deliverables ?? []).join('\n')} onChange={event => setEditing({ ...editing, deliverables: event.target.value.split('\n').map(value => value.trim()).filter(Boolean) })} /></label>
        <label className="form-wide"><span>合同与履约备注</span><textarea value={editing.note} onChange={event => setEditing({ ...editing, note: event.target.value })} /></label>
        <div className="form-wide payment-editor"><header><span>付款计划（不代表实际付款）</span><button type="button" className="button button--ghost" onClick={addPayment}>新增计划节点</button></header>{(editing.payments ?? []).map(payment => <div key={payment.id}>
          <input value={payment.title} onChange={event => setEditing({ ...editing, payments: (editing.payments ?? []).map(item => item.id === payment.id ? { ...item, title: event.target.value } : item) })} />
          <input type="number" min="0" value={payment.amount} onChange={event => setEditing({ ...editing, payments: (editing.payments ?? []).map(item => item.id === payment.id ? { ...item, amount: Number(event.target.value) } : item) })} />
          <input type="date" value={payment.dueDate} onChange={event => setEditing({ ...editing, payments: (editing.payments ?? []).map(item => item.id === payment.id ? { ...item, dueDate: event.target.value } : item) })} />
          <select value={payment.status} onChange={event => setEditing({ ...editing, payments: (editing.payments ?? []).map(item => item.id === payment.id ? { ...item, status: event.target.value as PaymentStatus } : item) })}><option>待支付</option><option>已支付</option><option>已逾期</option><option>已取消</option></select>
          <select value={payment.invoiceStatus} onChange={event => setEditing({ ...editing, payments: (editing.payments ?? []).map(item => item.id === payment.id ? { ...item, invoiceStatus: event.target.value as InvoiceStatus } : item) })}><option>未开票</option><option>开票中</option><option>已开票</option></select>
          <button className="icon-button" aria-label="删除付款计划节点" onClick={() => setEditing({ ...editing, payments: (editing.payments ?? []).filter(item => item.id !== payment.id) })}><Icon name="trash" /></button>
        </div>)}</div>
      </fieldset>}
    </Modal>
  </div>;
}