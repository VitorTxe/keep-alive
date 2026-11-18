import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import HeroMonitorPreview from './HeroMonitorPreview';
import { EASE_OUT_EXPO, fadeUp, staggerContainer } from './motionPresets';

export default function HeroSection() {
  const { scrollY } = useScroll();
  // Parallax sutil: o preview sobe e inclina levemente conforme o scroll
  const previewY = useTransform(scrollY, [0, 600], [0, -60]);
  const previewRotate = useTransform(scrollY, [0, 600], [8, 0]);

  return (
    <section className="relative overflow-hidden pb-20 pt-32 sm:pt-40">
      <div
        aria-hidden
        className="bg-grid pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_at_top,black_30%,transparent_75%)]"
      />
      <div
        aria-hidden
        className="glow-brand pointer-events-none absolute left-1/2 top-0 h-[480px] w-[880px] -translate-x-1/2"
      />

      <motion.div
        initial="hidden"
        animate="visible"
        variants={staggerContainer(0.12, 0.15)}
        className="relative mx-auto flex max-w-4xl flex-col items-center px-4 text-center sm:px-6"
      >
        <motion.h1
          variants={fadeUp}
          className="text-gradient text-4xl font-semibold leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl"
        >
          Seus projetos free tier,
          <br />
          sempre acordados.
        </motion.h1>

        <motion.p
          variants={fadeUp}
          className="mt-6 max-w-xl text-sm leading-relaxed text-fg-muted sm:text-base"
        >
          Monitoramento keep-alive para APIs em Render, Vercel, Supabase e Upstash. Elimine cold
          starts, meça a latência HTTP e do banco e receba alertas antes de qualquer recrutador
          perceber.
        </motion.p>

        <motion.div
          variants={fadeUp}
          className="mt-9 flex w-full flex-col gap-3 sm:w-auto sm:flex-row"
        >
          <Link
            to="/dashboard"
            className="group inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-fg px-6 text-sm font-semibold text-canvas transition-opacity hover:opacity-90"
          >
            Testar o Dashboard
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
          <a
            href="#features"
            className="inline-flex h-11 items-center justify-center rounded-xl border border-line bg-surface/60 px-6 text-sm font-medium text-fg transition-colors hover:border-line-strong"
          >
            Ver recursos
          </a>
        </motion.div>
      </motion.div>

      <div className="relative mx-auto mt-16 max-w-3xl px-4 [perspective:1400px] sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.55, ease: EASE_OUT_EXPO }}
          style={{ y: previewY, rotateX: previewRotate }}
        >
          <HeroMonitorPreview />
        </motion.div>
      </div>
    </section>
  );
}
