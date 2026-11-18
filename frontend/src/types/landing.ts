import type { LucideIcon } from 'lucide-react';

export interface LiveLatencyService {
  id: string;
  name: string;
  provider: string;
  base: number;
  db: number;
  latency: number;
  dbLatency: number;
  history: number[];
}

export interface LandingFeatureItem {
  icon: LucideIcon;
  title: string;
  description: string;
}

export interface LandingStepItem {
  step: string;
  title: string;
  description: string;
}

export interface LandingNavLink {
  href: string;
  label: string;
}

export interface CodeSnippetItem {
  id: string;
  label: string;
  code: string;
}
