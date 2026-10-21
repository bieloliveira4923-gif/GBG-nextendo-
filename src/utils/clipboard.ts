/**
 * Robust clipboard copy helper that handles modern navigator.clipboard
 * with seamless fallback to execCommand for sandboxed iframes and mobile browsers.
 */
export async function copyCode(text: string): Promise<boolean> {
  // 1. Try modern Clipboard API
  if (navigator?.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Modern API blocked by iframe permissions, fall through to fallback
    }
  }

  // 2. Hidden textarea fallback (works inside iframes)
  try {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.left = '-9999px';
    textarea.style.top = '0';
    textarea.style.opacity = '0';
    textarea.setAttribute('readonly', '');
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    textarea.setSelectionRange(0, 99999);

    const successful = document.execCommand('copy');
    document.body.removeChild(textarea);
    return successful;
  } catch {
    return false;
  }
}
