import {Icon} from '../../components/Icon';
import {StatCard} from '../../components/StatCard';
import {LoadingState} from '../../components/LoadingState';
import {calculateBudgetItems,summarizeBudget} from '../budget/budgetEngine';
import {currency,daysUntil,number} from '../../lib/format';
import {useWeddingData} from '../../state/WeddingDataProvider';

export function DashboardPage(){
  const{data,loading}=useWeddingData();
  if(loading||!data)return <LoadingState/>;
  const calculated=calculateBudgetItems(data.budget.items,data.budget.params);
  const summary=summarizeBudget(calculated,data.budget.params.totalBudgetCap);
  const confirmed=data.guests.filter(g=>g.rsvp==='已确认').reduce((s,g)=>s+g.companions+1,0);
  const guestTarget=Math.max(0,data.budget.params.guestCount);
  const confirmationRate=guestTarget>0?Math.round(confirmed/guestTarget*100):0;
  const completed=data.tasks.filter(t=>t.phase==='已完成').length;
  const openRisks=data.risks.filter(r=>r.status!=='已关闭').sort((a,b)=>(b.probability*b.impact)-(a.probability*a.impact));
  const urgent=data.tasks.filter(t=>t.phase!=='已完成').sort((a,b)=>a.dueDate.localeCompare(b.dueDate)).slice(0,5);
  const countdown=daysUntil(data.profile.weddingDate);
  return <div className="page dashboard-page">
    <section className="hero panel page-reveal">
      <div className="hero__copy"><span className="eyebrow">MASTER CONTROL · 全局态势</span><h1>{data.profile.groomName}<i>＆</i>{data.profile.brideName}</h1><p>{data.profile.venueName} · {data.profile.weddingDate} · {data.profile.ceremonyTime}</p><div className="hero__chips"><span><Icon name="calendar"/>婚礼倒计时</span><b>{countdown}</b><em>天</em><span className="pulse-chip">筹备节奏稳定</span></div></div>
      <div className="hero__orbit" aria-hidden="true"><span>{countdown}</span><small>DAYS</small><i/><i/><i/></div>
    </section>
    <section className="stats-grid">
      <StatCard label="预算占用" value={`${Math.round(summary.budgetUsageRate*100)}%`} detail={`${currency.format(summary.totalBudget)} / ${currency.format(data.budget.params.totalBudgetCap)}`} trend={summary.remainingBudget>=0?'预算可控':'需立即压降'} icon={<Icon name="budget"/>}/>
      <StatCard label="确认宾客" value={number.format(confirmed)} detail={guestTarget?`计划 ${number.format(guestTarget)} 人`:'尚未设置宾客目标'} trend={`${confirmationRate}% 已确认`} icon={<Icon name="guests"/>}/>
      <StatCard label="任务完成" value={`${completed}/${data.tasks.length}`} detail={`${data.tasks.filter(t=>t.priority==='P0'&&t.phase!=='已完成').length} 个 P0 未关闭`} trend="持续推进" icon={<Icon name="tasks"/>}/>
      <StatCard label="开放风险" value={openRisks.length} detail={`${openRisks.filter(r=>r.probability*r.impact>=12).length} 个高优先级`} trend="需要总指挥关注" icon={<Icon name="risk"/>}/>
    </section>
    <section className="dashboard-grid">
      <article className="panel dashboard-card page-reveal"><header><div><span className="eyebrow">COMMAND QUEUE</span><h2>下一步指挥清单</h2></div><Icon name="tasks"/></header><div className="command-list">{urgent.map((t,index)=><div key={t.id}><b>{String(index+1).padStart(2,'0')}</b><span><strong>{t.title}</strong><small>{t.owner} · {t.dueDate}</small></span><em className={`priority priority--${t.priority.toLowerCase()}`}>{t.priority}</em></div>)}</div></article>
      <article className="panel dashboard-card page-reveal"><header><div><span className="eyebrow">BUDGET STRUCTURE</span><h2>预算结构</h2></div><Icon name="budget"/></header><div className="budget-bars">{summary.categories.slice(0,6).map(c=><div key={c.category}><span><strong>{c.category}</strong><small>{currency.format(c.budget)}</small></span><i><b style={{width:`${Math.max(4,c.share*100)}%`}}/></i></div>)}</div></article>
      <article className="panel dashboard-card dashboard-card--wide page-reveal"><header><div><span className="eyebrow">RISK RADAR</span><h2>风险雷达</h2></div><Icon name="warning"/></header><div className="risk-radar">{openRisks.slice(0,5).map(r=>{const score=r.probability*r.impact;return <div key={r.id}><span className={`risk-dot ${score>=12?'is-high':score>=6?'is-mid':'is-low'}`}/><span><strong>{r.title}</strong><small>{r.trigger}</small></span><b>{score}</b><em>{r.owner}</em></div>})}</div></article>
      <article className="panel dashboard-card page-reveal"><header><div><span className="eyebrow">SUPPLIER PULSE</span><h2>供应商履约</h2></div><Icon name="vendors"/></header><div className="vendor-pulse">{data.vendors.slice(0,4).map(v=><div key={v.id}><span><strong>{v.name}</strong><small>{v.status} · 风险{v.riskLevel}</small></span><b>{currency.format(v.contractAmount-v.paidAmount)}</b></div>)}</div></article>
      <article className="panel dashboard-card page-reveal"><header><div><span className="eyebrow">RUN OF SHOW</span><h2>婚礼日关键节点</h2></div><Icon name="timeline"/></header><div className="mini-timeline">{data.timeline.slice(0,5).map(item=><div key={item.id}><b>{item.time}</b><span><strong>{item.title}</strong><small>{item.location} · {item.owner}</small></span></div>)}</div></article>
    </section>
  </div>
}