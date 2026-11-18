import { useCallback, useEffect, useRef, useState } from 'react';
import type { ShowToastFn } from '../types';

/**
 * Copia texto para a área de transferência com feedback visual temporário.
 * Falhas (permissão negada, contexto inseguro) geram toast + log descritivo.
 */
export function useCopyToClipboard(
  showToast: ShowToastFn,
  resetAfterMs = 2000
): { isCopied: boolean; copy: (text: string) => Promise<void> } {
  const [isCopied, setIsCopied] = useState(false);
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const copy = useCallback(
    async (text: string): Promise<void> => {
      try {
        if (!navigator.clipboard) {
          throw new Error(
            'Clipboard API indisponível neste navegador/contexto (requer HTTPS ou localhost).'
          );
        }
        await navigator.clipboard.writeText(text);
        setIsCopied(true);
        if (timeoutRef.current !== null) {
          window.clearTimeout(timeoutRef.current);
        }
        timeoutRef.current = window.setTimeout(() => setIsCopied(false), resetAfterMs);
      } catch (error) {
        console.error(
          '[useCopyToClipboard] Falha ao copiar conteúdo para a área de transferência:',
          error
        );
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
