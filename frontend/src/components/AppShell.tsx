import { useRef, useState, type ReactNode } from 'react';
import { BrandLogo } from './BrandLogo';
import { Icon, type IconName } from './Icon';
import { MotionBackdrop } from './MotionBackdrop';
import { useGlobalUiErrors } from '../hooks/useGlobalUiErrors';
import { useWeddingData } from '../state/WeddingDataProvider';
import type { RouteId, ThemeId } from '../types/domain';

const nav: Array<{ id: RouteId; label: string; group: string; icon: IconName }> = [
  { id: 'projects', label: '项目中心', group: '总览', icon: 'projects' },
  { id: 'dashboard', label: '指挥中心', group: '总览', icon: 'dashboard' },
  { id: 'operations', label: '婚礼全案', group: '总览', icon: 'sparkles' },
  { id: 'warroom', label: '婚礼日作战', group: '总览', icon: 'warroom' },
  { id: 'budget', label: '预算工作簿', group: '财务', icon: 'budget' },
  { id: 'finance', label: '财务与合同', group: '财务', icon: 'finance' },
  { id: 'tasks', label: '筹备任务', group: '协同', icon: 'tasks' },
  { id: 'guests', label: '宾客与 RSVP', group: '协同', icon: 'guests' },
  { id: 'seating', label: '排桌座位', group: '协同', icon: 'seating' },
  { id: 'vendors', label: '供应商合同', group: '执行', icon: 'vendors' },
  { id: 'timeline', label: '婚礼日流程', group: '执行', icon: 'timeline' },
  { id: 'invitations', label: '电子请帖', group: '执行', icon: 'invite' },
  { id: 'attachments', label: '附件中心', group: '执行', icon: 'attachments' },
  { id: 'risks', label: '风险预案', group: '治理', icon: 'risk' },
  { id: 'materials', label: '物料清单', group: '治理', icon: 'materials' },
  { id: 'conflicts', label: '同步与冲突', group: '治理', icon: 'conflicts' },
  { id: 'settings', label: '项目设置', group: '治理', icon: 'settings' }
];

const themes: Array<{ id: ThemeId; label: string; desc: string }> = [
  { id: 'champagne', label: '香槟鎏金', desc: '西式酒店' },
  { id: 'moonlight', label: '月光银白', desc: '现代克制' },
  { id: 'rose', label: '玫瑰花园', desc: '浪漫花艺' },
  { id: 'midnight', label: '极夜星河', desc: '舞台晚宴' },
  { id: 'festival', label: '盛世囍宴', desc: '中式喜庆' },
  { id: 'kawaii', label: '甜心萌礼', desc: '可爱轻甜' }
];

interface AppShellProps {
  route: RouteId;
  onRouteChange(value: RouteId): void;
  theme: ThemeId;
  onThemeChange(value: ThemeId): void;
  children: ReactNode;
}

export function AppShell({ route, onRouteChange, theme, onThemeChange, children }: AppShellProps) {
  const {
    data, dataSourceLabel, dataMode, saving, error, currentUser, outbox, conflicts, can,
    exportJson, importJson, retryLoad
  } = useWeddingData();
  const [themeOpen, setThemeOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [actionNotice, setActionNotice] = useState('');
  const [globalError, clearGlobalError] = useGlobalUiErrors();
  const inputRef = useRef<HTMLInputElement>(null);
  const groups = [...new Set(nav.map(item => item.group))];
  const current = nav.find(item => item.id === route) ?? nav[0]!;
  const pendingConflicts = conflicts.filter(item => item.status === '待处理').length;

  const handleJsonImport = async (file: File) => {
    try {
      await importJson(file);
      setActionNotice(`已导入项目数据：${file.name}`);
    } catch (importError) {
      setActionNotice(importError instanceof Error ? `导入失败：${importError.message}` : '导入失败：文件无法解析');
    }
  };

  return <div className="app-shell">
    <MotionBackdrop theme={theme} />
    <aside className={`sidebar ${mobileOpen ? 'is-open' : ''}`} aria-label="婚礼总指挥主导航">
      <div className="sidebar__brand">
        <BrandLogo />
        <button className="icon-button sidebar__mobile-close" aria-label="关闭导航" onClick={() => setMobileOpen(false)}><Icon name="close" /></button>
      </div>
      <nav>
        {groups.map(group => <div className="nav-group" key={group}>
          <span>{group}</span>
          {nav.filter(item => item.group === group).map(item => <button
            key={item.id}
            className={route === item.id ? 'is-active' : ''}
            aria-current={route === item.id ? 'page' : undefined}
            onClick={() => {
              onRouteChange(item.id);
              setMobileOpen(false);
            }}
          >
            <Icon name={item.icon} />
            <b>{item.label}</b>
            {item.id === 'conflicts' && (outbox.length + pendingConflicts) > 0 && <em>{outbox.length + pendingConflicts}</em>}
            {route === item.id && <i />}
          </button>)}
        </div>)}
      </nav>
      <div className="sidebar__footer">
        <div className="data-source">
          <Icon name="database" />
          <div>
            <strong>{dataSourceLabel}</strong>
            <span>{dataMode === 'api' ? '真实 API · 不回退 Mock' : '多项目 · 自动备份'}</span>
          </div>
          <i />
        </div>
        <small>Schema v{data?.schemaVersion ?? 4} · Revision {data?.revision ?? 0} · {saving ? '正在保存…' : outbox.length ? `${outbox.length} 条待同步` : '数据已同步'}</small>
      </div>
    </aside>

    <div className="app-stage">
      <header className="topbar">
        <div className="topbar__left">
          <button className="icon-button mobile-menu" aria-label="打开导航" onClick={() => setMobileOpen(true)}><Icon name="menu" /></button>
          <div><span>WEDDING COMMAND CENTER</span><strong>{current.label}<i>·</i>{saving ? '保存中' : pendingConflicts ? `${pendingConflicts} 个冲突待处理` : '实时协同'}</strong></div>
        </div>
        <div className="topbar__actions">
          <button className="toolbar-button" disabled={!can('project.write')} onClick={() => inputRef.current?.click()}><Icon name="upload" /><span>导入 JSON</span></button>
          <input
            ref={inputRef}
            hidden
            type="file"
            accept="application/json"
            onChange={event => {
              const file = event.target.files?.[0];
              if (file) void handleJsonImport(file);
              event.currentTarget.value = '';
            }}
          />
          <button className="toolbar-button" disabled={!can('privacy.export')} onClick={exportJson}><Icon name="download" /><span>导出数据</span></button>
          <button className="toolbar-button" aria-expanded={themeOpen} onClick={() => setThemeOpen(value => !value)}><Icon name="sparkles" /><span>切换主题</span></button>
          <button className="icon-button" aria-label="进入项目设置" title="项目设置" onClick={() => onRouteChange('settings')}><Icon name="settings" /></button>
          <button className="avatar-button" aria-label={`当前用户 ${currentUser?.name ?? '本地用户'}，角色 ${currentUser?.role ?? '未知'}，进入项目设置`} title={`${currentUser?.name ?? '本地用户'} · ${currentUser?.role ?? ''}`} onClick={() => onRouteChange('settings')}>{currentUser?.name?.slice(0, 1) || '总'}</button>
        </div>
        {themeOpen && <section className="theme-popover panel" aria-label="视觉主题中心">
          <div className="theme-popover__head">
            <div><strong>视觉主题中心</strong><span>六套主题共用同一组件与数据结构</span></div>
            <button className="icon-button" aria-label="关闭主题中心" onClick={() => setThemeOpen(false)}><Icon name="close" /></button>
          </div>
          <div className="theme-grid">
            {themes.map(item => <button
              key={item.id}
              className={`theme-card theme-card--${item.id} ${theme === item.id ? 'is-active' : ''}`}
              onClick={() => {
                onThemeChange(item.id);
                setThemeOpen(false);
              }}
            >
              <span className="theme-card__preview"><i /><i /><i /></span>
              <strong>{item.label}</strong>
              <small>{item.desc}</small>
            </button>)}
          </div>
        </section>}
      </header>
      {error && <div className="global-alert" role="alert">
        <Icon name="warning" /><strong>数据错误：</strong>{error}<button onClick={() => void retryLoad()}>重新加载</button>
      </div>}
      {actionNotice && <div className="global-alert" role={actionNotice.startsWith('导入失败') ? 'alert' : 'status'}>
        <Icon name={actionNotice.startsWith('导入失败') ? 'warning' : 'check'} /><span>{actionNotice}</span><button onClick={() => setActionNotice('')}>关闭</button>
      </div>}
      {globalError && <div className="global-alert" role="alert">
        <Icon name="warning" /><strong>前端操作失败：</strong>{globalError}<button onClick={clearGlobalError}>关闭</button>
      </div>}
      <main className="main-content">{children}</main>
    </div>
  </div>;
}
