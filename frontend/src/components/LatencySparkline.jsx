import { useState } from 'react';
import { formatExactDate } from '../utils/formatters';
import { getStatusConfig } from '../utils/statusConfig';

const MAX_BARS = 15;

export default function LatencySparkline({ logs = [] }) {
  const [hoveredLog, setHoveredLog] = useState(null);

  const orderedLogs = [...logs].slice(0, MAX_BARS).reverse();
  const maxLatency = Math.max(
    ...orderedLogs.map((log) => log.httpLatencyMs || 0),
    300
  );
  const emptySlotsCount = Math.max(0, MAX_BARS - orderedLogs.length);

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-[11px] text-zinc-500">
        <span>Últimas {MAX_BARS} execuções</span>
        {hoveredLog ? (
          <span className="font-mono text-zinc-300">
            {hoveredLog.httpLatencyMs} ms • {hoveredLog.triggerType}
          </span>
        ) : (
          <span className="font-mono text-zinc-500">
            {orderedLogs.length > 0 ? `${orderedLogs.length} registros` : 'Sem histórico'}
          </span>
        )}
      </div>

      <div
        className="relative flex h-10 items-end gap-1 rounded-lg border border-zinc-800/80 bg-zinc-950/70 px-2 py-1.5"
        onMouseLeave={() => setHoveredLog(null)}
      >
        {Array.from({ length: emptySlotsCount }).map((_, index) => (
          <div
            key={`empty-${index}`}
            className="h-1.5 flex-1 rounded-sm bg-zinc-800/40"
            aria-hidden="true"
          />
        ))}

        {orderedLogs.map((log) => {
          const config = getStatusConfig(log.status);
          const ratio = Math.min(1, Math.max(0.18, (log.httpLatencyMs || 0) / maxLatency));
          const heightPercent = Math.round(ratio * 100);
          const isHovered = hoveredLog?.id === log.id;

          return (
            <div
              key={log.id}
              onMouseEnter={() => setHoveredLog(log)}
              className="group relative flex h-full flex-1 cursor-pointer items-end"
            >
              <div
                style={{ height: `${heightPercent}%` }}
                className={`w-full rounded-sm transition-all duration-150 ${config.barClass} ${
                  isHovered ? 'scale-y-105 ring-1 ring-zinc-200/40' : 'opacity-90'
                }`}
              />

              {isHovered && (
                <div className="pointer-events-none absolute bottom-full left-1/2 z-30 mb-2 w-max -translate-x-1/2 rounded-lg border border-zinc-700 bg-zinc-900 px-2.5 py-1.5 text-[11px] shadow-xl">
                  <p className="font-medium text-zinc-100">{formatExactDate(log.createdAt)}</p>
                  <div className="mt-0.5 flex items-center gap-2 font-mono text-zinc-300">
                    <span className={config.textClass}>{log.httpLatencyMs} ms</span>
                    <span className="text-zinc-600">•</span>
                    <span className="rounded bg-zinc-800 px-1 py-0.5 text-[10px] text-zinc-300">
                      {log.triggerType}
                    </span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
