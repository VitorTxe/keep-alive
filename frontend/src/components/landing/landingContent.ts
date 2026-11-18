import {
  Database,
  Gauge,
  Mail,
  ScrollText,
  ShieldCheck,
  Timer,
} from 'lucide-react';
import type {
  LandingFeatureItem,
  LandingNavLink,
  LandingStepItem,
} from '../../types';

/** Link do repositório exibido na landing. */
export const GITHUB_URL = 'https://github.com/VitorTxe/keep-alive';

export const NAV_LINKS: readonly LandingNavLink[] = [
  { href: '#features', label: 'Recursos' },
  { href: '#how-it-works', label: 'Como funciona' },
  { href: '#status', label: 'Status' },
];

export const PROVIDERS: readonly string[] = [
  'Render',
  'Vercel',
  'Supabase',
  'MongoDB Atlas',
  'Upstash Redis',
  'Railway',
  'Cloudflare',
  'Neon',
];

export const FEATURES: readonly LandingFeatureItem[] = [
  {
    icon: Timer,
    title: 'Fim do cold start',
    description:
      'Pings agendados mantêm servidores free tier aquecidos. Seu recrutador nunca espera 50s pelo primeiro request.',
  },
  {
    icon: Database,
    title: 'Latência real do banco',
    description:
      'Endpoints que retornam dbLatencyMs têm a latência do Postgres, MongoDB ou Redis medida a cada execução.',
  },
  {
    icon: Mail,
    title: 'Alertas por e-mail',
    description:
      'Falhou ou voltou ao ar? Você recebe um e-mail na hora com status HTTP, latência e a mensagem de erro detalhada.',
  },
  {
    icon: ScrollText,
    title: 'Histórico auditável',
    description:
      'Cada ping vira log com gatilho (CRON ou manual), retenção de 60 dias e filtros por status.',
  },
  {
    icon: ShieldCheck,
    title: 'Seguro por padrão',
    description: 'Header x-ping-secret por projeto, Bearer token admin e RLS ativo no Supabase.',
  },
  {
    icon: Gauge,
    title: 'Classificação inteligente',
    description:
      'Respostas acima de 3s viram COLD_START, falhas viram OFFLINE. Sem ruído, só sinal.',
  },
];

export const STEPS: readonly LandingStepItem[] = [
  {
    step: '01',
    title: 'Exponha um /health',
    description: 'Crie uma rota leve que faz ping no banco e retorna { status, dbLatencyMs }.',
  },
  {
    step: '02',
    title: 'Cadastre no painel',
    description:
      'Informe a URL, o provedor e, opcionalmente, um x-ping-secret para proteger a rota.',
  },
  {
    step: '03',
    title: 'Deixe o cron trabalhar',
    description:
      'GitHub Actions ou Cloudflare Cron chamam /cron/ping-all e o monitor cuida do resto.',
  },
];
