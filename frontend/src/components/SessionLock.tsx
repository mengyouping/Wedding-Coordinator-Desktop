import { useEffect, useRef, useState, type ReactNode } from 'react';
import { BrandLogo } from './BrandLogo';
import { Icon } from './Icon';
import { useWeddingData } from '../state/WeddingDataProvider';

export function SessionLock({ children }: { children: ReactNode }) {
  const { data, currentUser } = useWeddingData();
  const [locked, setLocked] = useState(false);
  const lastActivity = useRef(Date.now());

  useEffect(() => {
    const markActive = () => {
      lastActivity.current = Date.now();
    };
    const events: Array<keyof WindowEventMap> = ['pointerdown', 'keydown', 'touchstart', 'focus'];
    for (const event of events) window.addEventListener(event, markActive, { passive: true });
    const timer = window.setInterval(() => {
      const minutes = data?.settings.autoLockMinutes ?? 0;
      if (minutes > 0 && Date.now() - lastActivity.current >= minutes * 60_000) setLocked(true);
    }, 15_000);
    return () => {
      for (const event of events) window.removeEventListener(event, markActive);
      window.clearInterval(timer);
    };
  }, [data?.settings.autoLockMinutes]);

  const unlock = () => {
    lastActivity.current = Date.now();
    setLocked(false);
  };

  if (!locked) return children;
  return <main className="session-lock">
    <section className="panel session-lock__card">
      <BrandLogo />
      <Icon name="lock" />
      <span className="eyebrow">PRIVACY LOCK</span>
      <h1>Wedding OS 已自动锁定</h1>
      <p>由于长时间未操作，宾客、合同和财务数据已从屏幕隐藏。</p>
      <strong>{currentUser?.name ?? '本地用户'} · {currentUser?.role ?? '项目成员'}</strong>
      <button className="button button--wide" onClick={unlock}>继续使用</button>
      <small>正式统一身份模式可在此接入二次身份验证。</small>
    </section>
  </main>;
}
