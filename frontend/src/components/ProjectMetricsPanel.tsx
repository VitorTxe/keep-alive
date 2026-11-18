import { Database, HardDrive, Info, Loader2 } from 'lucide-react';
import type { Project } from '../types';
import { formatLatency, formatStorageMb } from '../utils/formatters';
import LatencySparkline from './LatencySparkline';

const STORAGE_QUOTA_MB = 500;

export interface ProjectMetricsPanelProps {
  project: Project;
  isPinging: boolean;
}

/**
 * Painel interno de telemetria do `ProjectCard`: exibe latência HTTP,
 * latência de banco (com tooltip explicativo), uso de armazenamento e sparkline.
 */
export default function ProjectMetricsPanel({
  project,
  isPinging,
}: ProjectMetricsPanelProps) {
  const latestLog = project.logs?.[0] || null;
  const dbLatencyMs = latestLog?.dbLatencyMs;
  const hasDbLatency = dbLatencyMs !== null && dbLatencyMs !== undefined;
  const hasStorage = project.dbSizeMb !== null && project.dbSizeMb !== undefined;
  const storagePercent = hasStorage
    ? Math.min(100, Math.round(((project.dbSizeMb ?? 0) / STORAGE_QUOTA_MB) * 100))
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
                  Métrica exibida quando o endpoint retorna{' '}
                  <code className="font-mono text-emerald-400">dbLatencyMs</code> no JSON
                </span>
              </span>
            </div>
          )}
        </div>
      </div>

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

      <div className="mt-3">
        <LatencySparkline logs={project.logs} />
      </div>
    </div>
  );
}
