/**
 * Copies text to the user's clipboard.
 *
 * `navigator.clipboard` is only available in secure contexts (HTTPS or
 * localhost). When OmniTools is self-hosted and opened over plain HTTP
 * (e.g. http://umbrel.local:8080 or a LAN IP), it is `undefined`, so calling
 * `navigator.clipboard.writeText` throws and nothing gets copied.
 * In that case we fall back to the legacy `document.execCommand('copy')`.
 *
 * The returned promise rejects if the text could not be copied, so callers
 * can show an error message.
 */
export async function copyTextToClipboard(text: string): Promise<void> {
  if (window.isSecureContext && navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }
  legacyCopy(text);
}

function legacyCopy(text: string): void {
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', '');
  // Keep the helper element out of view and avoid scrolling the page
  textarea.style.position = 'fixed';
  textarea.style.top = '0';
  textarea.style.left = '0';
  textarea.style.opacity = '0';

  document.body.appendChild(textarea);
  textarea.select();
  try {
    if (!document.execCommand('copy')) {
      throw new Error('Copy command was rejected by the browser');
    }
  } finally {
    document.body.removeChild(textarea);
  }
}
