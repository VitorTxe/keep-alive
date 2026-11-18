import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Copia texto para a área de transferência com feedback visual.
 * Falhas (permissão negada, contexto inseguro) geram toast + log descritivo.
 */
export function useCopyToClipboard(showToast, resetAfterMs = 2000) {
  const [isCopied, setIsCopied] = useState(false);
  const timeoutRef = useRef(null);

  useEffect(() => () => clearTimeout(timeoutRef.current), []);

  const copy = useCallback(
    async (text) => {
      try {
        if (!navigator.clipboard) {
          throw new Error('Clipboard API indisponível neste navegador/contexto (requer HTTPS ou localhost).');
        }
        await navigator.clipboard.writeText(text);
        setIsCopied(true);
        clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => setIsCopied(false), resetAfterMs);
      } catch (error) {
        console.error('[useCopyToClipboard] Falha ao copiar conteúdo para a área de transferência:', error);
        showToast({
          type: 'error',
          title: 'Não foi possível copiar',
          message: 'Selecione o código manualmente e use Ctrl+C.',
        });
      }
    },
    [resetAfterMs, showToast]
  );

  return { isCopied, copy };
}
