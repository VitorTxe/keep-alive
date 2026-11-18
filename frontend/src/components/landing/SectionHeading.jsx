import { motion } from 'framer-motion';
import { fadeUp, revealOnScroll, staggerContainer } from './motionPresets';

export default function SectionHeading({ title, description, align = 'center' }) {
  const alignment = align === 'center' ? 'mx-auto text-center items-center' : 'items-start text-left';

  return (
    <motion.div
      {...revealOnScroll}
      variants={staggerContainer(0.1)}
      className={`flex max-w-2xl flex-col gap-4 ${alignment}`}
    >
      <motion.h2
        variants={fadeUp}
        className="text-gradient text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl"
      >
        {title}
      </motion.h2>
      {description && (
        <motion.p variants={fadeUp} className="text-sm leading-relaxed text-fg-muted sm:text-base">
          {description}
        </motion.p>
      )}
    </motion.div>
  );
}
