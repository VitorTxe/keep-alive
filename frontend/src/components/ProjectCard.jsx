import { useState } from 'react';
import {
  Clock,
  Database,
  ExternalLink,
  HardDrive,
  Info,
  Loader2,
  Pencil,
  Play,
  Trash2,
} from 'lucide-react';
import LatencySparkline from './LatencySparkline';
import {
  formatExactDate,
  formatLatency,
  formatRelativeTime,
  formatStorageMb,
} from '../utils/formatters';
import { getStatusConfig } from '../utils/statusConfig';

const STORAGE_QUOTA_MB = 500;

export default function ProjectCard({
  project,
  isPinging,
  isToggling,
  onPing,
  onToggleActive,
  onEdit,
  onDelete,
}) {
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const statusConfig = getStatusConfig(project.lastStatus);
  const latestLog = project.logs?.[0] || null;
  const dbLatencyMs = latestLog?.dbLatencyMs;
  const hasDbLatency = dbLatencyMs !== null && dbLatencyMs !== undefined;
  const hasStorage = project.dbSizeMb !== null && project.dbSizeMb !== undefined;
  const storagePercent = hasStorage
    ? Math.min(100, Math.round((project.dbSizeMb / STORAGE_QUOTA_MB) * 100))
    : 0;

  const latencyColorClass =
    project.lastLatencyMs === null || project.lastLatencyMs === undefined
      ? 'text-zinc-400'
      : project.lastStatus === 'OFFLINE'
        ? 'text-rose-400'
        : project.lastLatencyMs >= 3000
          ? 'text-amber-400'
          : 'text-emerald-400';

  return (
    <article
      className={`flex flex-col justify-between rounded-xl border border-zinc-800 bg-zinc-900/80 p-4 transition-all hover:border-zinc-700/80 ${
        !project.isActive ? 'opacity-60' : ''
      }`}
    >
      <div>
        {/* Cabeçalho */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium ${statusConfig.badgeClass}`}
              >
                <span className="relative flex h-1.5 w-1.5">
                  {project.lastStatus !== 'PENDING' && project.isActive && (
                    <span
                      className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 ${statusConfig.pingClass}`}
                    />
                  )}
                  <span
                    className={`relative inline-flex h-1.5 w-1.5 rounded-full ${statusConfig.dotClass}`}
                  />
                </span>
                {statusConfig.label}
              </span>

              <span className="inline-flex items-center rounded-md border border-zinc-800 bg-zinc-950/70 px-2 py-0.5 text-[11px] font-medium text-zinc-400">
                {project.providerInfo}
              </span>
            </div>

            <div className="mt-2.5 flex items-center gap-1.5">
              <h3 className="truncate text-base font-semibold tracking-tight text-zinc-100">
                {project.name}
              </h3>
              <a
                href={project.pingUrl}
                target="_blank"
                rel="noreferrer"
                title={project.pingUrl}
                className="shrink-0 rounded p-1 text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-200"
              >
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
            <p className="truncate font-mono text-[11px] text-zinc-500" title={project.pingUrl}>
              {project.pingUrl}
            </p>
          </div>

          {/* Switch Ativo/Pausado */}
          <button
            type="button"
            role="switch"
            aria-checked={project.isActive}
            disabled={isToggling}
            onClick={() => onToggleActive(project)}
            title={project.isActive ? 'Pausar monitoramento' : 'Ativar monitoramento'}
            className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border transition-colors focus:outline-none focus:ring-2 focus:ring-zinc-600 disabled:cursor-not-allowed disabled:opacity-50 ${
              project.isActive
                ? 'border-emerald-500/40 bg-emerald-500/20'
                : 'border-zinc-700 bg-zinc-800'
            }`}
          >
            <span
              className={`inline-block h-3.5 w-3.5 transform rounded-full transition-transform ${
                project.isActive ? 'translate-x-4 bg-emerald-400' : 'translate-x-1 bg-zinc-400'
              }`}
            />
          </button>
        </div>

        {/* Métricas e Sparkline */}
        <div className="relative mt-4">
          {isPinging && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 rounded-lg border border-zinc-800/80 bg-zinc-950/75 backdrop-blur-sm">
              <Loader2 className="h-5 w-5 animate-spin text-emerald-400" />
              <span className="text-xs font-medium text-zinc-200">
                Pingando serviço e banco...
              </span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2.5">
            <div className="rounded-lg border border-zinc-800/70 bg-zinc-950/60 p-2.5">
              <span className="text-[11px] text-zinc-500">Latência HTTP</span>
              <p className={`mt-0.5 font-mono text-lg font-semibold ${latencyColorClass}`}>
                {formatLatency(project.lastLatencyMs)}
              </p>
            </div>

            <div className="rounded-lg border border-zinc-800/70 bg-zinc-950/60 p-2.5">
              <span className="flex items-center gap-1 text-[11px] text-zinc-500">
                <Database className="h-3 w-3" />
                Latência DB
              </span>
              {hasDbLatency ? (
                <p className="mt-0.5 font-mono text-lg font-semibold text-zinc-200">
                  {formatLatency(dbLatencyMs)}
                </p>
              ) : (
                <div className="mt-0.5 flex items-center gap-1.5">
                  <p className="font-mono text-lg font-semibold text-zinc-500">N/A</p>
                  <span
                    tabIndex={0}
                    aria-label="Métrica exibida quando o endpoint retorna dbLatencyMs no JSON"
                    className="group/tooltip relative inline-flex cursor-help items-center text-zinc-500 transition-colors hover:text-zinc-300 focus:outline-none"
                  >
                    <Info className="h-3.5 w-3.5" />
                    <span
                      role="tooltip"
                      className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 w-52 -translate-x-1/2 rounded-lg border border-zinc-700 bg-zinc-900 px-2.5 py-1.5 text-[11px] font-normal leading-snug text-zinc-200 opacity-0 shadow-xl transition-opacity duration-150 group-hover/tooltip:opacity-100 group-focus/tooltip:opacity-100"
                    >
                      Métrica exibida quando o endpoint retorna <code className="font-mono text-emerald-400">dbLatencyMs</code> no JSON
                    </span>
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Armazenamento */}
          {hasStorage && (
            <div className="mt-3 rounded-lg border border-zinc-800/70 bg-zinc-950/60 p-2.5">
              <div className="flex items-center justify-between text-[11px]">
                <span className="flex items-center gap-1 text-zinc-400">
                  <HardDrive className="h-3 w-3 text-zinc-500" />
                  Armazenamento DB
                </span>
                <span className="font-mono text-zinc-300">
                  {formatStorageMb(project.dbSizeMb)} / {STORAGE_QUOTA_MB} MB
                </span>
              </div>
              <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-zinc-800">
                <div
                  style={{ width: `${storagePercent}%` }}
                  className={`h-full rounded-full transition-all ${
                    storagePercent >= 85
                      ? 'bg-rose-500'
                      : storagePercent >= 65
                        ? 'bg-amber-500'
                        : 'bg-emerald-500'
                  }`}
                />
              </div>
            </div>
          )}

          {/* Sparkline */}
          <div className="mt-3">
            <LatencySparkline logs={project.logs} />
          </div>
        </div>
      </div>

      {/* Rodapé */}
      <div className="mt-4 flex flex-col gap-3 border-t border-zinc-800/80 pt-3">
        <div className="flex items-center justify-between text-[11px] text-zinc-500">
          <span
            className="inline-flex items-center gap-1"
            title={formatExactDate(project.lastPingAt)}
          >
            <Clock className="h-3 w-3" />
            Último ping: <strong className="font-medium text-zinc-300">{formatRelativeTime(project.lastPingAt)}</strong>
          </span>
          {!project.isActive && (
            <span className="rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] font-medium text-zinc-400">
              Pausado
            </span>
          )}
        </div>

        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            disabled={isPinging}
            onClick={() => onPing(project.id)}
            className="inline-flex h-8 flex-1 items-center justify-center gap-1.5 rounded-lg border border-zinc-700/80 bg-zinc-800/90 px-3 text-xs font-medium text-zinc-100 transition-colors hover:border-zinc-600 hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPinging ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin text-amber-400" />
                <span>Acordando banco...</span>
              </>
            ) : (
              <>
                <Play className="h-3 w-3 text-emerald-400" />
                <span>Pingar Agora</span>
              </>
            )}
          </button>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => onEdit(project)}
              title="Editar projeto"
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-950/60 text-zinc-400 transition-colors hover:border-zinc-700 hover:bg-zinc-800 hover:text-zinc-100"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>

            {confirmingDelete ? (
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => {
                    onDelete(project.id);
                    setConfirmingDelete(false);
                  }}
                  className="h-8 rounded-lg border border-rose-500/40 bg-rose-500/15 px-2.5 text-[11px] font-semibold text-rose-300 transition-colors hover:bg-rose-500/25"
                >
                  Confirmar
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmingDelete(false)}
                  className="h-8 rounded-lg border border-zinc-800 bg-zinc-900 px-2 text-[11px] text-zinc-400 hover:text-zinc-200"
                >
                  Cancelar
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmingDelete(true)}
                title="Excluir projeto"
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-950/60 text-zinc-400 transition-colors hover:border-rose-500/40 hover:bg-rose-500/10 hover:text-rose-400"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
