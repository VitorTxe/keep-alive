import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Github } from 'lucide-react';
import { GITHUB_URL } from './landingContent';
import { fadeUp, revealOnScroll, staggerContainer } from './motionPresets';

export default function CtaSection() {
  return (
    <section className="px-4 pb-24 sm:px-6 sm:pb-32">
      <motion.div
        {...revealOnScroll}
        variants={staggerContainer(0.1)}
        className="relative mx-auto max-w-5xl overflow-hidden rounded-3xl border border-line bg-surface px-6 py-16 text-center sm:px-12 sm:py-20"
      >
        <div aria-hidden className="bg-grid pointer-events-none absolute inset-0 opacity-60 [mask-image:radial-gradient(ellipse_at_center,black_20%,transparent_70%)]" />
        <motion.div
          aria-hidden
          animate={{ scale: [1, 1.15, 1], opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
          className="glow-brand pointer-events-none absolute left-1/2 top-1/2 h-[420px] w-[720px] -translate-x-1/2 -translate-y-1/2"
        />

        <div className="relative">
          <motion.h2
            variants={fadeUp}
            className="text-gradient text-3xl font-semibold tracking-tight sm:text-5xl"
          >
            Pronto para nunca mais
            <br className="hidden sm:block" /> esperar um cold start?
          </motion.h2>
          <motion.p variants={fadeUp} className="mx-auto mt-5 max-w-lg text-sm leading-relaxed text-fg-muted sm:text-base">
            Abra o dashboard, cadastre um endpoint e veja o primeiro ping acontecer em segundos.
          </motion.p>
          <motion.div variants={fadeUp} className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              to="/dashboard"
              className="group inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-brand px-6 text-sm font-semibold text-brand-contrast transition-opacity hover:opacity-90"
            >
              Começar agora
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-line bg-canvas/60 px-6 text-sm font-medium text-fg transition-colors hover:border-line-strong"
            >
              <Github className="h-4 w-4" />
              Ver código-fonte
            </a>
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
}
