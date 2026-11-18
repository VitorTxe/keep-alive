export const STATUS_CONFIG = {
  ONLINE: {
    label: 'Online',
    shortLabel: 'Online',
    dotClass: 'bg-emerald-500',
    pingClass: 'bg-emerald-400',
    badgeClass: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    textClass: 'text-emerald-400',
    barClass: 'bg-emerald-500 hover:bg-emerald-400',
  },
  COLD_START: {
    label: 'Cold Start (>3s)',
    shortLabel: 'Cold Start',
    dotClass: 'bg-amber-500',
    pingClass: 'bg-amber-400',
    badgeClass: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    textClass: 'text-amber-400',
    barClass: 'bg-amber-500 hover:bg-amber-400',
  },
  OFFLINE: {
    label: 'Offline / Erro',
    shortLabel: 'Offline',
    dotClass: 'bg-rose-500',
    pingClass: 'bg-rose-400',
    badgeClass: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    textClass: 'text-rose-400',
    barClass: 'bg-rose-500 hover:bg-rose-400',
  },
  PENDING: {
    label: 'Aguardando 1º Ping',
    shortLabel: 'Pendente',
    dotClass: 'bg-zinc-500',
    pingClass: 'bg-zinc-400',
    badgeClass: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
    textClass: 'text-zinc-400',
    barClass: 'bg-zinc-600 hover:bg-zinc-500',
  },
};

export function getStatusConfig(status) {
  return STATUS_CONFIG[status] || STATUS_CONFIG.PENDING;
}
