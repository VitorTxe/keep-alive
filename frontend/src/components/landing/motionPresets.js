/**
 * Presets de animação compartilhados (Framer Motion).
 * Centralizar easing/duração garante ritmo visual consistente em toda a landing.
 */
export const EASE_OUT_EXPO = [0.16, 1, 0.3, 1];

export const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: EASE_OUT_EXPO },
  },
};

export const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.8, ease: EASE_OUT_EXPO } },
};

export const staggerContainer = (stagger = 0.08, delayChildren = 0) => ({
  hidden: {},
  visible: {
    transition: { staggerChildren: stagger, delayChildren },
  },
});

/** Props padrão para revelar seções ao entrar na viewport, uma única vez. */
export const revealOnScroll = {
  initial: 'hidden',
  whileInView: 'visible',
  viewport: { once: true, margin: '-80px' },
};
