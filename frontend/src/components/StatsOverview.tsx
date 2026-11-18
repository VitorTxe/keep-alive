import { AlertTriangle, CheckCircle2, Clock, Layers, type LucideIcon } from 'lucide-react';
import type { ProjectsSummary } from '../types';

export interface StatsOverviewProps {
  summary: ProjectsSummary;
}

interface StatCardItem {
  label: string;
  value: number;
  icon: LucideIcon;
  iconClass: string;
  accentClass: string;
  valueClass: string;
}

export default function StatsOverview({ summary }: StatsOverviewProps) {
  const cards: StatCardItem[] = [
    {
      label: 'Total de Projetos',
      value: summary?.totalProjects ?? 0,
      icon: Layers,
      iconClass: 'text-zinc-400',
      accentClass: 'border-zinc-800 bg-zinc-900/80',
      valueClass: 'text-zinc-100',
    },
    {
      label: 'Online',
      value: summary?.onlineCount ?? 0,
      icon: CheckCircle2,
      iconClass: 'text-emerald-400',
      accentClass: 'border-zinc-800 bg-zinc-900/80',
      valueClass: 'text-emerald-400',
    },
    {
      label: 'Cold Start',
      value: summary?.coldStartCount ?? 0,
      icon: Clock,
      iconClass: 'text-amber-400',
      accentClass: 'border-zinc-800 bg-zinc-900/80',
      valueClass: 'text-amber-400',
    },
    {
      label: 'Offline',
      value: summary?.offlineCount ?? 0,
      icon: AlertTriangle,
      iconClass: 'text-rose-400',
      accentClass: 'border-zinc-800 bg-zinc-900/80',
      valueClass: 'text-rose-400',
    },
  ];

  return (
    <section
      aria-label="Resumo do sistema"
      className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4"
    >
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.label}
            className={`rounded-xl border p-4 transition-colors hover:border-zinc-700/80 ${card.accentClass}`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-zinc-400">{card.label}</span>
              <Icon className={`h-4 w-4 ${card.iconClass}`} />
            </div>
            <p
              className={`mt-2 font-mono text-2xl font-semibold tracking-tight ${card.valueClass}`}
            >
              {card.value}
            </p>
          </div>
        );
      })}
    </section>
  );
}
