import { Link } from 'react-router-dom';
import { Activity, Loader2, LogIn, LogOut, Plus, RefreshCw, Zap } from 'lucide-react';

export default function Header({
  user,
  isAuthenticated,
  isPingingAll,
  isRefreshing,
  offlineCount,
  onPingAll,
  onNewProject,
  onRefresh,
  onSignOut,
}) {
  const systemHealthy = offlineCount === 0;

  return (
    <header className="sticky top-0 z-30 border-b border-zinc-800/80 bg-zinc-950/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900 shadow-inner">
              <Activity className="h-4 w-4 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-sm font-semibold tracking-tight text-zinc-100 sm:text-base">
                  Keep-Alive Monitor
                </h1>
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium ${
                    systemHealthy
                      ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400'
                      : 'border-rose-500/20 bg-rose-500/10 text-rose-400'
                  }`}
                >
                  <span className="relative flex h-1.5 w-1.5">
                    <span
                      className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 ${
                        systemHealthy ? 'bg-emerald-400' : 'bg-rose-400'
                      }`}
                    />
                    <span
                      className={`relative inline-flex h-1.5 w-1.5 rounded-full ${
                        systemHealthy ? 'bg-emerald-500' : 'bg-rose-500'
                      }`}
                    />
                  </span>
                  {systemHealthy ? 'Sistema Operacional' : `${offlineCount} Serviço(s) Offline`}
                </span>
              </div>
              <p className="text-xs text-zinc-500">
                Observabilidade contínua & prevenção de cold start
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onRefresh}
            disabled={isRefreshing}
            title="Atualizar dados agora"
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900/80 px-3 text-xs font-medium text-zinc-300 transition-colors hover:border-zinc-700 hover:bg-zinc-800 hover:text-zinc-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Atualizar</span>
          </button>

          <button
            type="button"
            onClick={onPingAll}
            disabled={isPingingAll}
            className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900 px-3.5 text-xs font-medium text-zinc-200 transition-colors hover:border-zinc-700 hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50 sm:flex-initial"
          >
            {isPingingAll ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin text-amber-400" />
                <span>Pingando todos...</span>
              </>
            ) : (
              <>
                <Zap className="h-3.5 w-3.5 text-amber-400" />
                <span>Pingar Todos</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onNewProject}
            className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg bg-zinc-100 px-3.5 text-xs font-semibold text-zinc-950 transition-colors hover:bg-zinc-200 sm:flex-initial"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Novo Projeto</span>
          </button>

          {isAuthenticated ? (
            <button
              type="button"
              onClick={onSignOut}
              title={`Conectado como ${user?.email} — Sair`}
              className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900/80 px-3 text-xs font-medium text-zinc-300 transition-colors hover:border-zinc-700 hover:bg-zinc-800 hover:text-zinc-100"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden max-w-36 truncate sm:inline">{user?.email}</span>
            </button>
          ) : (
            <Link
              to="/login"
              title="Entrar ou criar conta"
              className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900/80 px-3 text-xs font-medium text-zinc-300 transition-colors hover:border-zinc-700 hover:bg-zinc-800 hover:text-zinc-100"
            >
              <LogIn className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Entrar</span>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
