import { useState } from 'react';
import { AlertOctagon, Loader2, Terminal, X } from 'lucide-react';
import { formatExactDate, formatLatency } from '../utils/formatters';
import { getStatusConfig } from '../utils/statusConfig';

const LOG_FILTERS = ['ALL', 'ONLINE', 'COLD_START', 'OFFLINE'];

export default function LogsTable({ logs = [], isLoading = false }) {
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedErrorLog, setSelectedErrorLog] = useState(null);

  const filteredLogs = logs.filter((log) =>
    statusFilter === 'ALL' ? true : log.status === statusFilter
  );

  return (
    <section className="rounded-xl border border-zinc-800 bg-zinc-900/80">
      <div className="flex flex-col gap-3 border-b border-zinc-800 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Terminal className="h-4 w-4 text-zinc-400" />
          <div>
            <h2 className="text-sm font-semibold text-zinc-100">Histórico Global Recente</h2>
            <p className="text-xs text-zinc-500">Últimas {logs.length} execuções registradas</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {LOG_FILTERS.map((filter) => {
            const label =
              filter === 'ALL' ? 'Todos' : getStatusConfig(filter).shortLabel;
            const active = statusFilter === filter;

            return (
              <button
                key={filter}
                type="button"
                onClick={() => setStatusFilter(filter)}
                className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                  active
                    ? 'bg-zinc-100 text-zinc-950'
                    : 'border border-zinc-800 bg-zinc-950/60 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center gap-2.5 px-4 py-12 text-xs text-zinc-400">
          <Loader2 className="h-5 w-5 animate-spin text-emerald-400" />
          <span>Executando pings e atualizando histórico de logs...</span>
        </div>
      ) : filteredLogs.length === 0 ? (
        <div className="px-4 py-10 text-center text-xs text-zinc-500">
          Nenhum log encontrado para o filtro selecionado.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-xs">
            <thead>
              <tr className="border-b border-zinc-800/80 bg-zinc-950/40 text-[11px] uppercase tracking-wider text-zinc-500">
                <th className="px-4 py-2.5 font-medium">Status</th>
                <th className="px-4 py-2.5 font-medium">Projeto</th>
                <th className="px-4 py-2.5 font-medium">HTTP</th>
                <th className="px-4 py-2.5 font-medium">Latência HTTP</th>
                <th className="px-4 py-2.5 font-medium">Latência DB</th>
                <th className="px-4 py-2.5 font-medium">Gatilho</th>
                <th className="px-4 py-2.5 font-medium">Data/Hora</th>
                <th className="px-4 py-2.5 text-right font-medium">Detalhes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {filteredLogs.map((log) => {
                const config = getStatusConfig(log.status);
                const isCron = log.triggerType === 'CRON';

                return (
                  <tr
                    key={log.id}
                    className="transition-colors hover:bg-zinc-800/30"
                  >
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium ${config.badgeClass}`}
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${config.dotClass}`} />
                        {config.shortLabel}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-zinc-200">
                        {log.project?.name || 'Projeto removido'}
                      </div>
                      {log.project?.providerInfo && (
                        <div className="text-[11px] text-zinc-500">
                          {log.project.providerInfo}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 font-mono text-zinc-300">
                      <span
                        className={`rounded px-1.5 py-0.5 ${
                          log.httpStatus >= 200 && log.httpStatus < 300
                            ? 'bg-emerald-500/10 text-emerald-400'
                            : 'bg-rose-500/10 text-rose-400'
                        }`}
                      >
                        {log.httpStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-zinc-200">
                      {formatLatency(log.httpLatencyMs)}
                    </td>
                    <td className="px-4 py-3 font-mono text-zinc-400">
                      {formatLatency(log.dbLatencyMs)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded border px-1.5 py-0.5 font-mono text-[10px] font-medium ${
                          isCron
                            ? 'border-zinc-700 bg-zinc-800/80 text-zinc-300'
                            : 'border-sky-500/20 bg-sky-500/10 text-sky-400'
                        }`}
                      >
                        {log.triggerType}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-[11px] text-zinc-400">
                      {formatExactDate(log.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {log.errorMessage ? (
                        <button
                          type="button"
                          onClick={() => setSelectedErrorLog(log)}
                          className="inline-flex items-center gap-1 rounded-md border border-rose-500/30 bg-rose-500/10 px-2 py-1 text-[11px] font-medium text-rose-400 transition-colors hover:bg-rose-500/20"
                        >
                          <AlertOctagon className="h-3 w-3" />
                          Ver Erro
                        </button>
                      ) : (
                        <span className="text-zinc-600">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal de Detalhes do Erro */}
      {selectedErrorLog && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/80 p-4 backdrop-blur-sm"
          onClick={() => setSelectedErrorLog(null)}
        >
          <div
            className="w-full max-w-lg rounded-xl border border-zinc-800 bg-zinc-900 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
              <div className="flex items-center gap-2">
                <AlertOctagon className="h-4 w-4 text-rose-400" />
                <h3 className="text-sm font-semibold text-zinc-100">
                  Diagnóstico de Falha — {selectedErrorLog.project?.name || 'Projeto'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedErrorLog(null)}
                className="rounded-md p-1 text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3 p-4">
              <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-400">
                <span>
                  HTTP: <strong className="font-mono text-rose-400">{selectedErrorLog.httpStatus}</strong>
                </span>
                <span>•</span>
                <span>
                  Latência: <strong className="font-mono text-zinc-200">{formatLatency(selectedErrorLog.httpLatencyMs)}</strong>
                </span>
                <span>•</span>
                <span className="font-mono">{formatExactDate(selectedErrorLog.createdAt)}</span>
              </div>

              <div className="rounded-lg border border-rose-500/20 bg-zinc-950 p-3">
                <p className="mb-1 text-[11px] font-medium uppercase tracking-wider text-rose-400">
                  Mensagem Técnica
                </p>
                <pre className="max-h-60 overflow-auto whitespace-pre-wrap break-words font-mono text-xs leading-relaxed text-zinc-200">
                  {selectedErrorLog.errorMessage}
                </pre>
              </div>
            </div>

            <div className="flex justify-end border-t border-zinc-800 px-4 py-3">
              <button
                type="button"
                onClick={() => setSelectedErrorLog(null)}
                className="rounded-lg bg-zinc-800 px-3.5 py-1.5 text-xs font-medium text-zinc-200 transition-colors hover:bg-zinc-700"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
