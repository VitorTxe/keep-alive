import { motion } from 'framer-motion';
import type { ShowToastFn } from '../../types';
import CodeTabs from './CodeTabs';
import SectionHeading from './SectionHeading';
import { STEPS } from './landingContent';
import { fadeUp, revealOnScroll, staggerContainer } from './motionPresets';

export interface HowItWorksSectionProps {
  showToast: ShowToastFn;
}

export default function HowItWorksSection({ showToast }: HowItWorksSectionProps) {
  return (
    <section
      id="how-it-works"
      className="relative scroll-mt-24 border-t border-line bg-surface/30 py-24 sm:py-32"
    >
      <div className="mx-auto grid max-w-6xl gap-14 px-4 sm:px-6 lg:grid-cols-2 lg:items-center">
        <div>
          <SectionHeading
            align="left"
            eyebrow="Como funciona"
            title="Três passos. Zero cold start."
            description="Um contrato simples: seu endpoint responde JSON com dbLatencyMs e o monitor cuida de medir, classificar, registrar e alertar."
          />

          <motion.ol
            {...revealOnScroll}
            variants={staggerContainer(0.12)}
            className="relative mt-10 space-y-6"
          >
            <span aria-hidden className="absolute bottom-3 left-[15px] top-3 w-px bg-line" />
            {STEPS.map((item) => (
              <motion.li key={item.step} variants={fadeUp} className="relative flex gap-4">
                <span className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-line bg-canvas font-mono text-[11px] text-brand">
                  {item.step}
                </span>
                <div>
                  <h3 className="text-sm font-semibold text-fg">{item.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-fg-muted">{item.description}</p>
                </div>
              </motion.li>
            ))}
          </motion.ol>
        </div>

        <motion.div
          initial={{ opacity: 0, x: 40 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          <CodeTabs showToast={showToast} />
        </motion.div>
      </div>
    </section>
  );
}
