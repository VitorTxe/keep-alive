import { motion } from 'framer-motion';
import { Activity, type LucideIcon } from 'lucide-react';
import BentoHighlightVisual from './BentoHighlightVisual';
import SectionHeading from './SectionHeading';
import SpotlightCard from './SpotlightCard';
import { FEATURES } from './landingContent';
import { revealOnScroll, staggerContainer } from './motionPresets';

function FeatureIcon({ icon: Icon }: { icon: LucideIcon }) {
  return (
    <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-line bg-surface-raised text-brand transition-colors group-hover:border-brand/40">
      <Icon className="h-4 w-4" />
    </span>
  );
}

export default function FeaturesBento() {
  return (
    <section
      id="features"
      className="mx-auto max-w-6xl scroll-mt-24 px-4 py-24 sm:px-6 sm:py-32"
    >
      <SectionHeading
        eyebrow="Recursos"
        title="Observabilidade sem a complexidade"
        description="Tudo o que você precisa para manter projetos de portfólio rápidos e confiáveis, sem pagar por infraestrutura enterprise."
      />

      <motion.div
        {...revealOnScroll}
        variants={staggerContainer(0.08)}
        className="mt-14 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
      >
        <SpotlightCard className="sm:col-span-2 lg:col-span-3">
          <div className="flex flex-col gap-2 md:max-w-lg">
            <FeatureIcon icon={Activity} />
            <h3 className="mt-3 text-lg font-semibold text-fg">Monitoramento em tempo real</h3>
            <p className="text-sm leading-relaxed text-fg-muted">
              Latência HTTP, latência do banco e status de cada execução em um só lugar, com
              sparkline das últimas execuções e logs detalhados.
            </p>
          </div>
          <BentoHighlightVisual />
        </SpotlightCard>

        {FEATURES.map((feature) => (
          <SpotlightCard key={feature.title}>
            <FeatureIcon icon={feature.icon} />
            <h3 className="mt-5 text-base font-semibold text-fg">{feature.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-fg-muted">{feature.description}</p>
          </SpotlightCard>
        ))}
      </motion.div>
    </section>
  );
}
