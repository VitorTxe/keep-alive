import { motion } from 'framer-motion';

function getBarTone(value) {
  if (value >= 3000) return 'bg-warning';
  if (value >= 1000) return 'bg-accent';
  return 'bg-brand';
}

/** Mini gráfico de barras animado: cada nova amostra entra com layout animation. */
export default function MiniBars({ values, height = 32 }) {
  const max = Math.max(...values, 400);

  return (
    <div className="flex items-end gap-[3px]" style={{ height }}>
      {values.map((value, index) => (
        <motion.span
          key={`${index}-${values.length}`}
          layout
          initial={false}
          animate={{ height: `${Math.max(10, (Math.min(value, max) / max) * 100)}%` }}
          transition={{ type: 'spring', stiffness: 260, damping: 28 }}
          className={`w-1.5 rounded-sm ${getBarTone(value)} ${index === values.length - 1 ? 'opacity-100' : 'opacity-60'}`}
        />
      ))}
    </div>
  );
}
