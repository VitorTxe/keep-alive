import { useEffect } from 'react';
import Lenis from 'lenis';
import 'lenis/dist/lenis.css';

/**
 * Inicializa o scroll suave com Lenis e garante limpeza completa
 * do loop `requestAnimationFrame` ao desmontar a página.
 */
export function useSmoothScroll(): void {
  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const lenis = new Lenis({
      lerp: 0.08,
      smoothWheel: true,
      anchors: true,
    });

    let rafId = 0;

    function raf(time: number): void {
      lenis.raf(time);
      rafId = window.requestAnimationFrame(raf);
    }

    rafId = window.requestAnimationFrame(raf);

    return () => {
      window.cancelAnimationFrame(rafId);
      lenis.destroy();
    };
  }, []);
}
