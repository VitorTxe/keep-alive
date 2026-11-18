import { AlertOctagon, X } from 'lucide-react';
import type { PingLog } from '../types';
import { formatExactDate, formatLatency } from '../utils/formatters';

export interface ErrorLogModalProps {
  log: PingLog | null;
  onClose: () => void;
}

/**
 * Modal de inspeção técnica de falhas de ping (status HTTP, latência e stack/erro de rede).
 */
export default function ErrorLogModal({ log, onClose }: ErrorLogModalProps) {
  if (!log) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/80 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-xl border border-zinc-800 bg-zinc-900 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
          <div className="flex items-center gap-2">
            <AlertOctagon className="h-4 w-4 text-rose-400" />
            <h3 className="text-sm font-semibold text-zinc-100">
              Diagnóstico de Falha — {log.project?.name || 'Projeto'}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-3 p-4">
          <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-400">
            <span>
              HTTP: <strong className="font-mono text-rose-400">{log.httpStatus}</strong>
            </span>
            <span>•</span>
            <span>
              Latência:{' '}
              <strong className="font-mono text-zinc-200">
                {formatLatency(log.httpLatencyMs)}
              </strong>
            </span>
            <span>•</span>
            <span className="font-mono">{formatExactDate(log.createdAt)}</span>
          </div>

          <div className="rounded-lg border border-rose-500/20 bg-zinc-950 p-3">
            <p className="mb-1 text-[11px] font-medium uppercase tracking-wider text-rose-400">
              Mensagem Técnica
            </p>
            <pre className="max-h-60 overflow-auto whitespace-pre-wrap break-words font-mono text-xs leading-relaxed text-zinc-200">
              {log.errorMessage}
            </pre>
          </div>
        </div>

        <div className="flex justify-end border-t border-zinc-800 px-4 py-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-zinc-800 px-3.5 py-1.5 text-xs font-medium text-zinc-200 transition-colors hover:bg-zinc-700"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
