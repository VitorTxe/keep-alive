import { motion } from 'framer-motion';
import { useLiveLatencyFeed } from '../../hooks/useLiveLatencyFeed';
import MiniBars from './MiniBars';

const LOG_LINES = [
  { status: 'ONLINE', tone: 'text-brand', text: 'GET /api/health 200 · 142ms · db 18ms' },
  { status: 'COLD', tone: 'text-warning', text: 'GET /api/health 200 · 3.4s · db 61ms' },
  { status: 'ONLINE', tone: 'text-brand', text: 'GET /api/health 200 · 96ms · db 9ms' },
  { status: 'OFFLINE', tone: 'text-danger', text: 'GET /api/health 503 · alerta enviado' },
] as const;

/** Visual do card destaque do bento: gráfico vivo + stream de logs. */
export default function BentoHighlightVisual() {
  const [primary] = useLiveLatencyFeed(1400);

  return (
    <div className="mt-6 grid gap-4 md:grid-cols-2">
      <div className="rounded-xl border border-line bg-canvas/60 p-4">
        <div className="flex items-baseline justify-between">
          <span className="text-[11px] text-fg-subtle">Latência HTTP · {primary.name}</span>
          <span className="font-mono text-sm font-semibold text-brand">{primary.latency}ms</span>
        </div>
        <div className="mt-4">
          <MiniBars values={primary.history} height={72} />
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-line bg-canvas/60 p-4 font-mono text-[11px]">
        <p className="mb-3 text-fg-subtle">$ tail -f ping_logs</p>
        <ul className="space-y-2">
          {LOG_LINES.map((line, index) => (
            <motion.li
              key={line.text}
              initial={{ opacity: 0, x: -12 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.25 + index * 0.18, duration: 0.4 }}
              className="flex gap-2 truncate"
            >
              <span className={`w-14 shrink-0 ${line.tone}`}>{line.status}</span>
              <span className="truncate text-fg-muted">{line.text}</span>
            </motion.li>
          ))}
        </ul>
      </div>
    </div>
  );
}
