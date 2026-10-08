import { useEffect, useState } from 'react';

function messageOf(value: unknown): string {
  if (value instanceof Error) return value.message;
  if (typeof value === 'string') return value;
  try { return JSON.stringify(value); }
  catch { return '未知前端异常'; }
}

/**
 * 捕获事件处理器异常和未处理 Promise，防止按钮失败后完全无反馈。
 * Provider 自己管理的业务错误仍由 Provider.error 展示。
 */
export function useGlobalUiErrors(): readonly [string, () => void] {
  const [message, setMessage] = useState('');

  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      setMessage(event.error ? messageOf(event.error) : event.message || '前端运行异常');
    };
    const handleRejection = (event: PromiseRejectionEvent) => {
      event.preventDefault();
      setMessage(messageOf(event.reason));
    };
    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleRejection);
    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleRejection);
    };
  }, []);

  return [message, () => setMessage('')] as const;
}
