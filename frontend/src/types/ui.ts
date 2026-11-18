export type ToastType = 'success' | 'error' | 'info';

export interface ToastMessage {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
}

export interface ToastInput {
  type?: ToastType;
  title?: string;
  message: string;
  durationMs?: number;
}

export type ShowToastFn = (input: ToastInput) => void;

export interface StatusVisualConfig {
  label: string;
  shortLabel: string;
  dotClass: string;
  pingClass: string;
  badgeClass: string;
  textClass: string;
  barClass: string;
}
