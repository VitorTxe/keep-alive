import { useMemo } from 'react';
import { motion, type Variants } from 'framer-motion';
import SectionHeading from './SectionHeading';
import { revealOnScroll, staggerContainer } from './motionPresets';

type DayState = 'up' | 'cold' | 'down';

const DAYS = 60;
const MONITORS = [
  { name: 'ChefIA API', seed: 7, uptime: '99.98%' },
  { name: 'CRM Dev', seed: 13, uptime: '100%' },
  { name: 'Queue Worker', seed: 29, uptime: '99.71%' },
] as const;

const TONES: Record<DayState, string> = {
  up: 'bg-brand',
  cold: 'bg-warning',
  down: 'bg-danger',
};

/**
 * PRNG determinístico (Linear Congruential Generator): garante barras idênticas
 * entre renders sem depender de `Math.random()` durante a renderização.
 */
function seededDays(seed: number): DayState[] {
  let value = seed;
  return Array.from({ length: DAYS }, (): DayState => {
    value = (value * 9301 + 49297) % 233280;
    const roll = value / 233280;
    if (roll > 0.975) return 'down';
    if (roll > 0.93) return 'cold';
    return 'up';
  });
}

const barVariant: Variants = {
  hidden: { scaleY: 0.2, opacity: 0 },
  visible: { scaleY: 1, opacity: 1, transition: { duration: 0.35 } },
};

export default function UptimeSection() {
  const monitors = useMemo(
    () => MONITORS.map((m) => ({ ...m, days: seededDays(m.seed) })),
    []
  );

  return (
    <section
      id="status"
      className="mx-auto max-w-6xl scroll-mt-24 px-4 py-24 sm:px-6 sm:py-32"
    >
      <SectionHeading
        eyebrow="Status"
        title="Histórico que conta a história"
        description="60 dias de retenção para enxergar padrões de cold start e quedas antes que virem problema."
      />

      <div className="mt-14 space-y-4 rounded-2xl border border-line bg-surface p-5 sm:p-8">
        {monitors.map((monitor) => (
          <div key={monitor.name}>
            <div className="mb-2 flex items-center justify-between text-xs">
              <span className="flex items-center gap-2 font-medium text-fg">
                <span className="h-1.5 w-1.5 rounded-full bg-brand" />
                {monitor.name}
              </span>
              <span className="font-mono text-fg-muted">{monitor.uptime} uptime</span>
            </div>
            <motion.div
              {...revealOnScroll}
              variants={staggerContainer(0.012)}
              className="flex h-8 items-stretch gap-[2px]"
            >
              {monitor.days.map((state, index) => (
                <motion.span
                  key={index}
                  variants={barVariant}
                  title={`Dia ${index + 1}: ${
                    state === 'up' ? 'Online' : state === 'cold' ? 'Cold start' : 'Offline'
                  }`}
                  className={`flex-1 origin-bottom rounded-[2px] ${TONES[state]} opacity-80 transition-opacity hover:opacity-100`}
                />
              ))}
            </motion.div>
          </div>
        ))}

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4 text-[11px] text-fg-subtle">
          <span>60 dias atrás</span>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-sm bg-brand" />
              Online
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-sm bg-warning" />
              Cold start
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-sm bg-danger" />
              Offline
            </span>
          </div>
          <span>Hoje</span>
        </div>
      </div>
    </section>
  );
}
