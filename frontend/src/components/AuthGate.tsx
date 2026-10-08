import { useEffect, useState, type ReactNode } from 'react';
import { appConfig } from '../config/appConfig';
import {
  beginBackendLogin,
  completeBackendLogin,
  type AuthSession
} from '../services/auth/authSession';
import { BrandLogo } from './BrandLogo';
import { Icon } from './Icon';

export function AuthGate({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null | undefined>(
    appConfig.authMode === 'disabled' ? null : undefined
  );
  const [error, setError] = useState('');
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    if (appConfig.authMode === 'disabled') return;
    let active = true;
    completeBackendLogin()
      .then(value => {
        if (active) setSession(value);
      })
      .catch(reason => {
        if (!active) return;
        setSession(null);
        setError(reason instanceof Error ? reason.message : '登录令牌校验失败');
      });
    return () => {
      active = false;
    };
  }, []);

  if (appConfig.authMode === 'disabled') return children;
  if (session) return children;

  const login = async () => {
    setError('');
    setRedirecting(true);
    try {
      await beginBackendLogin();
    } catch (reason) {
      setRedirecting(false);
      setError(reason instanceof Error ? reason.message : '无法获取统一登录地址');
    }
  };

  return <main className="auth-gate">
    <section className="panel auth-card" aria-busy={session === undefined || redirecting}>
      <BrandLogo />
      <span className="eyebrow">ADABAS UNIFIED IDENTITY</span>
      <h1>登录后进入婚礼总指挥</h1>
      <p>登录地址和令牌校验均由 Wedding Coordinator 后端代理。浏览器不会保存账号密码，也不会持有 ADABAS ApiToken。</p>
      {error ? <p className="form-error" role="alert">{error}</p> : null}
      <button className="button button--wide" onClick={login} disabled={session === undefined || redirecting}>
        <Icon name="arrow" />
        {session === undefined ? '正在校验登录状态' : redirecting ? '正在前往统一登录' : '前往统一登录'}
      </button>
      <small>登录回调会先由后端验证，成功后再进入业务首页。</small>
    </section>
  </main>;
}
