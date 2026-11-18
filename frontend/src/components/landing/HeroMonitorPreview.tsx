import { AnimatePresence, motion } from 'framer-motion';
import { Database } from 'lucide-react';
import { useLiveLatencyFeed } from '../../hooks/useLiveLatencyFeed';
import MiniBars from './MiniBars';

function getStatus(latency: number): { label: string; dot: string; text: string } {
  if (latency >= 3000) return { label: 'Cold Start', dot: 'bg-warning', text: 'text-warning' };
  return { label: 'Online', dot: 'bg-brand', text: 'text-brand' };
}

/** Janela de preview do dashboard com dados vivos simulados — vitrine visual do Hero. */
export default function HeroMonitorPreview() {
  const services = useLiveLatencyFeed();

  return (
    <div className="relative overflow-hidden rounded-2xl border border-line bg-surface/80 shadow-2xl shadow-canvas backdrop-blur">
      <div className="flex items-center justify-between border-b border-line px-4 py-3">
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-line-strong" />
          <span className="h-2.5 w-2.5 rounded-full bg-line-strong" />
          <span className="h-2.5 w-2.5 rounded-full bg-line-strong" />
        </div>
        <span className="font-mono text-[11px] text-fg-subtle">keep-alive / dashboard</span>
        <span className="flex items-center gap-1.5 font-mono text-[11px] text-brand">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand opacity-75" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-brand" />
          </span>
          live
        </span>
      </div>

      <ul className="divide-y divide-line">
        {services.map((service) => {
          const status = getStatus(service.latency);
          return (
            <li
              key={service.id}
              className="grid grid-cols-[1fr_auto] items-center gap-4 px-4 py-3.5 sm:grid-cols-[1.4fr_auto_auto]"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
                  <p className="truncate text-sm font-medium text-fg">{service.name}</p>
                </div>
                <p className="mt-0.5 truncate pl-3.5 text-[11px] text-fg-subtle">
                  {service.provider}
                </p>
              </div>

              <div className="hidden sm:block">
                <MiniBars values={service.history} height={28} />
              </div>

              <div className="w-20 text-right">
                <AnimatePresence mode="popLayout" initial={false}>
                  <motion.p
                    key={service.latency}
                    initial={{ y: 8, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -8, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className={`font-mono text-sm font-semibold ${status.text}`}
                  >
                    {service.latency >= 1000
                      ? `${(service.latency / 1000).toFixed(1)}s`
                      : `${service.latency}ms`}
                  </motion.p>
                </AnimatePresence>
                <p className="mt-0.5 flex items-center justify-end gap-1 font-mono text-[10px] text-fg-subtle">
                  <Database className="h-2.5 w-2.5" />
                  {service.dbLatency}ms
                </p>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
