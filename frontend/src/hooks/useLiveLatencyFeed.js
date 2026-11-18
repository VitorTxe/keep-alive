import { useEffect, useState } from 'react';

const SEED_SERVICES = [
  { id: 'chefia', name: 'ChefIA API', provider: 'Render + MongoDB', base: 140, db: 18 },
  { id: 'crm', name: 'CRM Dev', provider: 'Vercel + Supabase', base: 90, db: 11 },
  { id: 'queue', name: 'Queue Worker', provider: 'Railway + Upstash', base: 210, db: 6 },
];

const HISTORY_SIZE = 18;

function jitter(base, spread) {
  return Math.max(4, Math.round(base + (Math.random() - 0.5) * spread));
}

function buildInitialState() {
  return SEED_SERVICES.map((service) => ({
    ...service,
    latency: service.base,
    dbLatency: service.db,
    history: Array.from({ length: HISTORY_SIZE }, () => jitter(service.base, service.base * 0.6)),
  }));
}

/**
 * Gera um feed simulado de latências para a vitrine da landing page.
 * Não consome a API real: a landing precisa funcionar mesmo com o backend dormindo.
 */
export function useLiveLatencyFeed(intervalMs = 1600) {
  const [services, setServices] = useState(buildInitialState);

  useEffect(() => {
    const timer = setInterval(() => {
      setServices((prev) =>
        prev.map((service) => {
          // 6% de chance de simular um cold start para dar vida ao gráfico
          const isSpike = Math.random() < 0.06;
          const latency = isSpike ? jitter(3400, 800) : jitter(service.base, service.base * 0.6);
          return {
            ...service,
            latency,
            dbLatency: jitter(service.db, service.db),
            history: [...service.history.slice(1), latency],
          };
        })
      );
    }, intervalMs);

    return () => clearInterval(timer);
  }, [intervalMs]);

  return services;
}
