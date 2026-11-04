import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { copyTextToClipboard } from './clipboard';

describe('copyTextToClipboard', () => {
  const originalClipboard = Object.getOwnPropertyDescriptor(
    navigator,
    'clipboard'
  );
  const originalSecureContext = Object.getOwnPropertyDescriptor(
    window,
    'isSecureContext'
  );
  const originalExecCommand = document.execCommand;

  const setClipboard = (value: unknown) =>
    Object.defineProperty(navigator, 'clipboard', {
      value,
      configurable: true
    });
  const setSecureContext = (value: boolean) =>
    Object.defineProperty(window, 'isSecureContext', {
      value,
      configurable: true
    });

  beforeEach(() => {
    document.execCommand = vi.fn().mockReturnValue(true);
  });

  afterEach(() => {
    if (originalClipboard) {
      Object.defineProperty(navigator, 'clipboard', originalClipboard);
    }
    if (originalSecureContext) {
      Object.defineProperty(window, 'isSecureContext', originalSecureContext);
    } else {
      delete (window as { isSecureContext?: boolean }).isSecureContext;
    }
    document.execCommand = originalExecCommand;
  });

  it('uses the Clipboard API in a secure context', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    setClipboard({ writeText });
    setSecureContext(true);

    await copyTextToClipboard('{\n  "a": 1\n}');

    expect(writeText).toHaveBeenCalledWith('{\n  "a": 1\n}');
    expect(document.execCommand).not.toHaveBeenCalled();
  });

  it('falls back to execCommand when the Clipboard API is unavailable (plain HTTP)', async () => {
    setClipboard(undefined);
    setSecureContext(false);

    let copiedText: string | undefined;
    document.execCommand = vi.fn(() => {
      copiedText = document.querySelector('textarea')?.value;
      return true;
    });

    await expect(copyTextToClipboard('{\n  "a": 1\n}')).resolves.toBe(
      undefined
    );

    expect(document.execCommand).toHaveBeenCalledWith('copy');
    expect(copiedText).toBe('{\n  "a": 1\n}');
    // The temporary textarea is cleaned up
    expect(document.querySelectorAll('textarea')).toHaveLength(0);
  });

  it('rejects when the browser refuses the fallback copy', async () => {
    setClipboard(undefined);
    setSecureContext(false);
    document.execCommand = vi.fn().mockReturnValue(false);

    await expect(copyTextToClipboard('text')).rejects.toThrow();
    expect(document.querySelectorAll('textarea')).toHaveLength(0);
  });
});
