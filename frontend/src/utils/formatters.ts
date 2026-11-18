/**
 * Formata uma data ISO para tempo relativo legível em Português (ex: "Há 2 horas").
 */
export function formatRelativeTime(dateInput: string | Date | null | undefined): string {
  if (!dateInput) return 'Nunca';

  const date = new Date(dateInput);
  if (Number.isNaN(date.getTime())) return 'Data inválida';

  const diffSeconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diffSeconds < 10) return 'Agora mesmo';
  if (diffSeconds < 60) return `Há ${diffSeconds}s`;

  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) {
    return diffMinutes === 1 ? 'Há 1 minuto' : `Há ${diffMinutes} minutos`;
  }

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) {
    return diffHours === 1 ? 'Há 1 hora' : `Há ${diffHours} horas`;
  }

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) {
    return diffDays === 1 ? 'Há 1 dia' : `Há ${diffDays} dias`;
  }

  const diffMonths = Math.floor(diffDays / 30);
  return diffMonths === 1 ? 'Há 1 mês' : `Há ${diffMonths} meses`;
}

/**
 * Formata uma data ISO para exibição completa (tooltip e tabela de logs).
 */
export function formatExactDate(dateInput: string | Date | null | undefined): string {
  if (!dateInput) return 'Sem registro';

  const date = new Date(dateInput);
  if (Number.isNaN(date.getTime())) return 'Data inválida';

  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(date);
}

/**
 * Formata latência em ms ou segundos quando >= 1000ms (ex: "142 ms" ou "4.2 s").
 */
export function formatLatency(latencyMs: number | null | undefined): string {
  if (latencyMs === null || latencyMs === undefined) return '—';
  if (latencyMs < 1000) return `${Math.round(latencyMs)} ms`;
  return `${(latencyMs / 1000).toFixed(1)} s`;
}

/**
 * Formata tamanho em Megabytes com 1 casa decimal (ex: "42.5 MB").
 */
export function formatStorageMb(sizeMb: number | null | undefined): string {
  if (sizeMb === null || sizeMb === undefined) return '—';
  return `${Number(sizeMb).toFixed(1)} MB`;
}
