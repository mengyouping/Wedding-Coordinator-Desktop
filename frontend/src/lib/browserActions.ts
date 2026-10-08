export async function copyTextToClipboard(text: string): Promise<void> {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', 'true');
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.select();
  const copied = document.execCommand('copy');
  textarea.remove();
  if (!copied) throw new Error('当前浏览器不允许复制到剪贴板');
}

export function openExternalWindow(url: string): void {
  const opened = window.open(url, '_blank');
  if (!opened) throw new Error('浏览器阻止了新窗口，请允许弹出窗口后重试');
  try { opened.opener = null; }
  catch { /* 跨域窗口无法写 opener 时无需阻塞预览。 */ }
}
