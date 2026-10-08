import { useState } from 'react';
import { Icon } from '../../components/Icon';
import { LoadingState } from '../../components/LoadingState';
import { Modal } from '../../components/Modal';
import { PageHeader } from '../../components/PageHeader';
import { createId } from '../../lib/id';
import { currency } from '../../lib/format';
import { useWeddingData } from '../../state/WeddingDataProvider';
import type { ContractRecord, FinancialTransaction, InvoiceStatus, Quote, WeddingDatabase } from '../../types/domain';
import { financeWarnings, summarizeFinance } from './financeEngine';
import { applyFinancialProjection } from './financialProjection';

const blankQuote = (): Quote => ({ id: createId('quote'), vendorId: '', budgetItemId: '', title: '', amount: 0, validUntil: '', selected: false, note: '' });
const blankContract = (): ContractRecord => ({ id: createId('contract'), vendorId: '', budgetItemIds: [], title: '', amount: 0, signedAt: '', status: '草稿', attachmentIds: [], note: '' });
const blankTransaction = (): FinancialTransaction => ({ id: createId('transaction'), contractId: '', vendorId: '', budgetItemId: '', type: '付款', amount: 0, occurredAt: new Date().toISOString().slice(0, 10), invoiceStatus: '未开票', note: '' });

function project(database: WeddingDatabase, updater: (value: WeddingDatabase) => WeddingDatabase): WeddingDatabase {
  return applyFinancialProjection(updater(structuredClone(database)));
}

export function FinancePage() {
  const { data, loading, updateDatabase, can } = useWeddingData();
  const [quote, setQuote] = useState<Quote | null>(null);
  const [contract, setContract] = useState<ContractRecord | null>(null);
  const [transaction, setTransaction] = useState<FinancialTransaction | null>(null);
  if (loading || !data) return <LoadingState />;
  const writable = can('budget.write');

  const financialData = applyFinancialProjection(data);
  const summary = summarizeFinance(financialData);
  const warnings = financeWarnings(financialData);

  const saveQuote = () => {
    if (!writable || !quote?.title.trim() || !quote.vendorId || !quote.budgetItemId) return;
    updateDatabase(database => project(database, current => ({
      ...current,
      quotes: current.quotes.some(item => item.id === quote.id)
        ? current.quotes.map(item => item.id === quote.id ? quote : item)
        : [...current.quotes, quote]
    })));
    setQuote(null);
  };

  const selectQuote = (selected: Quote) => {
    if (!writable) return;
    updateDatabase(database => project(database, current => ({
      ...current,
      quotes: current.quotes.map(item => item.budgetItemId === selected.budgetItemId ? { ...item, selected: item.id === selected.id } : item)
    })));
  };

  const saveContract = () => {
    if (!writable || !contract?.title.trim() || !contract.vendorId) return;
    updateDatabase(database => project(database, current => ({
      ...current,
      contracts: current.contracts.some(item => item.id === contract.id)
        ? current.contracts.map(item => item.id === contract.id ? contract : item)
        : [...current.contracts, contract]
    })));
    setContract(null);
  };

  const saveTransaction = () => {
    if (!writable || !transaction || transaction.amount <= 0) return;
    updateDatabase(database => project(database, current => ({
      ...current,
      transactions: current.transactions.some(item => item.id === transaction.id)
        ? current.transactions.map(item => item.id === transaction.id ? transaction : item)
        : [...current.transactions, transaction]
    })));
    setTransaction(null);
  };

  const deleteQuote = (id: string) => {
    if (!writable) return;
    updateDatabase(database => project(database, current => ({ ...current, quotes: current.quotes.filter(item => item.id !== id) })));
  };
  const deleteContract = (id: string) => {
    if (!writable) return;
    updateDatabase(database => project(database, current => ({
      ...current,
      contracts: current.contracts.filter(item => item.id !== id),
      transactions: current.transactions.map(item => item.contractId === id ? { ...item, contractId: '' } : item)
    })));
  };
  const deleteTransaction = (id: string) => {
    if (!writable) return;
    updateDatabase(database => project(database, current => ({ ...current, transactions: current.transactions.filter(item => item.id !== id) })));
  };

  return <div className="page finance-page">
    <PageHeader
      eyebrow="FINANCIAL CONTROL"
      title="财务合同与结算"
      description="FinancialTransaction 是实际资金唯一事实源；预算实际、供应商已付和合同引用由系统统一投影。"
      actions={<><button className="button button--ghost" disabled={!writable} onClick={() => setQuote(blankQuote())}><Icon name="plus" />新增报价</button><button className="button button--ghost" disabled={!writable} onClick={() => setContract(blankContract())}><Icon name="plus" />新增合同</button><button className="button" disabled={!writable} onClick={() => setTransaction(blankTransaction())}><Icon name="plus" />登记流水</button></>}
    />

    {warnings.map(warning => <div className="global-alert" key={warning}><Icon name="warning" /><span>{warning}</span></div>)}

    <section className="stats-grid finance-stats">
      <article className="metric panel"><span>预算上限</span><strong>{currency.format(summary.budgetCap)}</strong><small>计划成本 {currency.format(summary.plannedBudget)}</small></article>
      <article className="metric panel"><span>合同总额</span><strong>{currency.format(summary.contractValue)}</strong><small>已选报价 {currency.format(summary.selectedQuotes)}</small></article>
      <article className="metric panel"><span>净付款</span><strong>{currency.format(summary.netPaid)}</strong><small>付款 {currency.format(summary.paid)} · 退款 {currency.format(summary.refunded)}</small></article>
      <article className={`metric panel ${summary.varianceToCap > 0 ? 'metric--danger' : ''}`}><span>预计最终成本</span><strong>{currency.format(summary.projectedFinal)}</strong><small>{summary.varianceToCap > 0 ? `超预算 ${currency.format(summary.varianceToCap)}` : `剩余 ${currency.format(Math.abs(summary.varianceToCap))}`}</small></article>
    </section>

    <section className="finance-grid">
      <article className="panel finance-section">
        <header><div><span className="eyebrow">QUOTES</span><h2>供应商报价</h2></div><span>{financialData.quotes.length}</span></header>
        <div className="finance-list">{financialData.quotes.map(item => <div key={item.id} className={item.selected ? 'is-selected' : ''}><div><strong>{item.title}</strong><span>{financialData.vendors.find(vendor => vendor.id === item.vendorId)?.name || '未知供应商'} · {financialData.budget.items.find(budget => budget.id === item.budgetItemId)?.name || '未知预算项'}</span><small>有效期 {item.validUntil || '未设置'} · {item.note || '暂无备注'}</small></div><b>{currency.format(item.amount)}</b><button disabled={!writable || item.selected} onClick={() => selectQuote(item)}>{item.selected ? '已选中' : '选用'}</button><button className="icon-button" disabled={!writable} aria-label={`编辑报价 ${item.title}`} onClick={() => setQuote(item)}><Icon name="edit" /></button></div>)}</div>
      </article>

      <article className="panel finance-section">
        <header><div><span className="eyebrow">CONTRACTS</span><h2>合同台账</h2></div><span>{financialData.contracts.length}</span></header>
        <div className="finance-list">{financialData.contracts.map(item => {
          const paid = financialData.transactions.filter(row => row.contractId === item.id && row.type === '付款').reduce((sum, row) => sum + row.amount, 0);
          const refund = financialData.transactions.filter(row => row.contractId === item.id && row.type === '退款').reduce((sum, row) => sum + row.amount, 0);
          return <div key={item.id}><div><strong>{item.title}</strong><span>{financialData.vendors.find(vendor => vendor.id === item.vendorId)?.name || '未知供应商'} · {item.status}</span><small>净付款 {currency.format(paid - refund)} · 关联 {item.budgetItemIds.length} 个预算项</small></div><b>{currency.format(item.amount)}</b><button className="icon-button" disabled={!writable} aria-label={`编辑合同 ${item.title}`} onClick={() => setContract(item)}><Icon name="edit" /></button></div>;
        })}</div>
      </article>
    </section>

    <section className="panel finance-section">
      <header><div><span className="eyebrow">CASH FLOW</span><h2>资金流水与开票</h2></div><strong>待付 {currency.format(summary.outstanding)}</strong></header>
      <div className="table-scroll"><table className="data-table"><thead><tr><th>日期</th><th>类型</th><th>合同 / 供应商</th><th>金额</th><th>发票</th><th>备注</th><th /></tr></thead><tbody>{financialData.transactions.slice().sort((a, b) => b.occurredAt.localeCompare(a.occurredAt)).map(item => <tr key={item.id}><td>{item.occurredAt}</td><td><span className={`status ${item.type === '退款' ? 'status--warning' : 'status--success'}`}>{item.type}</span></td><td>{financialData.contracts.find(contractItem => contractItem.id === item.contractId)?.title || financialData.vendors.find(vendor => vendor.id === item.vendorId)?.name || '未关联'}</td><td>{currency.format(item.type === '退款' ? -item.amount : item.amount)}</td><td>{item.invoiceStatus}</td><td>{item.note}</td><td><button className="icon-button" disabled={!writable} aria-label="编辑财务流水" onClick={() => setTransaction(item)}><Icon name="edit" /></button></td></tr>)}</tbody></table></div>
    </section>

    <Modal open={Boolean(quote)} title="供应商报价" onClose={() => setQuote(null)} footer={<><button className="button button--ghost" onClick={() => setQuote(null)}>取消</button>{quote && financialData.quotes.some(item => item.id === quote.id) && <button className="button button--danger" disabled={!writable} onClick={() => { deleteQuote(quote.id); setQuote(null); }}>删除</button>}<button className="button" disabled={!writable} onClick={saveQuote}>保存</button></>}>
      {quote && <div className="form-grid"><label className="form-wide"><span>报价名称</span><input disabled={!writable} value={quote.title} onChange={event => setQuote({ ...quote, title: event.target.value })} /></label><label><span>供应商</span><select disabled={!writable} value={quote.vendorId} onChange={event => setQuote({ ...quote, vendorId: event.target.value })}><option value="">请选择</option>{financialData.vendors.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label><label><span>预算项</span><select disabled={!writable} value={quote.budgetItemId} onChange={event => setQuote({ ...quote, budgetItemId: event.target.value })}><option value="">请选择</option>{financialData.budget.items.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label><label><span>报价金额</span><input disabled={!writable} type="number" min="0" value={quote.amount} onChange={event => setQuote({ ...quote, amount: Number(event.target.value) })} /></label><label><span>有效期</span><input disabled={!writable} type="date" value={quote.validUntil} onChange={event => setQuote({ ...quote, validUntil: event.target.value })} /></label><label className="form-wide"><span>备注</span><textarea disabled={!writable} value={quote.note} onChange={event => setQuote({ ...quote, note: event.target.value })} /></label></div>}
    </Modal>

    <Modal open={Boolean(contract)} title="合同记录" onClose={() => setContract(null)} footer={<><button className="button button--ghost" onClick={() => setContract(null)}>取消</button>{contract && financialData.contracts.some(item => item.id === contract.id) && <button className="button button--danger" disabled={!writable} onClick={() => { deleteContract(contract.id); setContract(null); }}>删除</button>}<button className="button" disabled={!writable} onClick={saveContract}>保存</button></>}>
      {contract && <div className="form-grid"><label className="form-wide"><span>合同名称</span><input disabled={!writable} value={contract.title} onChange={event => setContract({ ...contract, title: event.target.value })} /></label><label><span>供应商</span><select disabled={!writable} value={contract.vendorId} onChange={event => setContract({ ...contract, vendorId: event.target.value })}><option value="">请选择</option>{financialData.vendors.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label><label><span>合同金额</span><input disabled={!writable} type="number" min="0" value={contract.amount} onChange={event => setContract({ ...contract, amount: Number(event.target.value) })} /></label><label><span>签署日期</span><input disabled={!writable} type="date" value={contract.signedAt} onChange={event => setContract({ ...contract, signedAt: event.target.value })} /></label><label><span>状态</span><select disabled={!writable} value={contract.status} onChange={event => setContract({ ...contract, status: event.target.value as ContractRecord['status'] })}><option>草稿</option><option>已签署</option><option>履约中</option><option>已完成</option><option>已终止</option></select></label><fieldset disabled={!writable} className="form-wide choice-field"><legend>关联预算项</legend>{financialData.budget.items.map(item => <label key={item.id}><input type="checkbox" checked={contract.budgetItemIds.includes(item.id)} onChange={() => setContract({ ...contract, budgetItemIds: contract.budgetItemIds.includes(item.id) ? contract.budgetItemIds.filter(id => id !== item.id) : [...contract.budgetItemIds, item.id] })} />{item.name}</label>)}</fieldset><label className="form-wide"><span>备注</span><textarea disabled={!writable} value={contract.note} onChange={event => setContract({ ...contract, note: event.target.value })} /></label></div>}
    </Modal>

    <Modal open={Boolean(transaction)} title="财务流水" onClose={() => setTransaction(null)} footer={<><button className="button button--ghost" onClick={() => setTransaction(null)}>取消</button>{transaction && financialData.transactions.some(item => item.id === transaction.id) && <button className="button button--danger" disabled={!writable} onClick={() => { deleteTransaction(transaction.id); setTransaction(null); }}>删除</button>}<button className="button" disabled={!writable} onClick={saveTransaction}>保存</button></>}>
      {transaction && <div className="form-grid"><label><span>类型</span><select disabled={!writable} value={transaction.type} onChange={event => setTransaction({ ...transaction, type: event.target.value as FinancialTransaction['type'] })}><option>付款</option><option>退款</option><option>调整</option></select></label><label><span>金额</span><input disabled={!writable} type="number" min="0" value={transaction.amount} onChange={event => setTransaction({ ...transaction, amount: Number(event.target.value) })} /></label><label><span>发生日期</span><input disabled={!writable} type="date" value={transaction.occurredAt} onChange={event => setTransaction({ ...transaction, occurredAt: event.target.value })} /></label><label><span>发票状态</span><select disabled={!writable} value={transaction.invoiceStatus} onChange={event => setTransaction({ ...transaction, invoiceStatus: event.target.value as InvoiceStatus })}><option>未开票</option><option>开票中</option><option>已开票</option></select></label><label className="form-wide"><span>关联合同</span><select disabled={!writable} value={transaction.contractId ?? ''} onChange={event => { const selected = financialData.contracts.find(item => item.id === event.target.value); setTransaction({ ...transaction, contractId: event.target.value, vendorId: selected?.vendorId ?? transaction.vendorId }); }}><option value="">不关联合同</option>{financialData.contracts.map(item => <option key={item.id} value={item.id}>{item.title}</option>)}</select></label><label className="form-wide"><span>关联预算项</span><select disabled={!writable} value={transaction.budgetItemId ?? ''} onChange={event => setTransaction({ ...transaction, budgetItemId: event.target.value })}><option value="">不关联预算项</option>{financialData.budget.items.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label><label className="form-wide"><span>备注</span><textarea disabled={!writable} value={transaction.note} onChange={event => setTransaction({ ...transaction, note: event.target.value })} /></label></div>}
    </Modal>
  </div>;
}
