import type { PointerEvent, ReactNode } from 'react';
import { motion, useMotionTemplate, useMotionValue } from 'framer-motion';
import { fadeUp } from './motionPresets';

export interface SpotlightCardProps {
  children: ReactNode;
  className?: string;
}

/** Card com holofote que segue o cursor via MotionValues (zero re-render React no pointermove). */
export default function SpotlightCard({ children, className = '' }: SpotlightCardProps) {
  const mouseX = useMotionValue(-200);
  const mouseY = useMotionValue(-200);
  const spotlight = useMotionTemplate`radial-gradient(320px circle at ${mouseX}px ${mouseY}px, rgb(var(--color-brand) / 0.10), transparent 70%)`;

  function handlePointerMove(event: PointerEvent<HTMLElement>): void {
    const bounds = event.currentTarget.getBoundingClientRect();
    mouseX.set(event.clientX - bounds.left);
    mouseY.set(event.clientY - bounds.top);
  }

  return (
    <motion.article
      variants={fadeUp}
      onPointerMove={handlePointerMove}
      onPointerLeave={() => {
        mouseX.set(-200);
        mouseY.set(-200);
      }}
      whileHover={{ y: -4 }}
      transition={{ type: 'spring', stiffness: 300, damping: 24 }}
      className={`group relative overflow-hidden rounded-2xl border border-line bg-surface p-6 transition-colors hover:border-line-strong ${className}`}
    >
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{ background: spotlight }}
      />
      <div className="relative">{children}</div>
    </motion.article>
  );
}
