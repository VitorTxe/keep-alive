import { Plus, Search, ServerCrash } from 'lucide-react';
import Header from './components/Header';
import LogsTable from './components/LogsTable';
import ProjectCard from './components/ProjectCard';
import ProjectModal from './components/ProjectModal';
import StatsOverview from './components/StatsOverview';
import ToastContainer from './components/Toast';
import { useAuthSession } from './hooks/useAuthSession';
import { useDashboardMonitor } from './hooks/useDashboardMonitor';
import { useToast } from './hooks/useToast';
import type { StatusFilterKey } from './types';

const STATUS_FILTERS: ReadonlyArray<{ key: StatusFilterKey; label: string }> = [
  { key: 'ALL', label: 'Todos' },
  { key: 'ONLINE', label: 'Online' },
  { key: 'COLD_START', label: 'Cold Start' },
  { key: 'OFFLINE', label: 'Offline' },
];

export default function App() {
  const { toasts, showToast, dismissToast } = useToast();
  const { user, isAuthenticated, signOut } = useAuthSession(showToast);
  const {
    projects,
    filteredProjects,
    summary,
    logs,
    isLoading,
    isRefreshing,
    isPingingAll,
    pingingIds,
    togglingIds,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    modalState,
    isSubmittingModal,
    loadDashboardData,
    handleOpenNewProject,
    handleEditProject,
    handleCloseModal,
    handlePingSingle,
    handlePingAll,
    handleToggleActive,
    handleSaveProject,
    handleDeleteProject,
  } = useDashboardMonitor(isAuthenticated, showToast);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <Header
        user={user}
        isAuthenticated={isAuthenticated}
        isPingingAll={isPingingAll}
        isRefreshing={isRefreshing}
        offlineCount={summary.offlineCount}
        onPingAll={() => void handlePingAll()}
        onNewProject={handleOpenNewProject}
        onRefresh={() => void loadDashboardData()}
        onSignOut={signOut}
      />

      <main className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <StatsOverview summary={summary} />

        <section className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por nome ou provedor..."
              className="h-9 w-full rounded-lg border border-zinc-800 bg-zinc-900/80 pl-9 pr-3 text-xs text-zinc-100 placeholder-zinc-500 focus:border-zinc-700 focus:outline-none"
            />
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {STATUS_FILTERS.map((filter) => (
              <button
                key={filter.key}
                type="button"
                onClick={() => setStatusFilter(filter.key)}
                className={`h-8 rounded-lg px-3 text-xs font-medium transition-colors ${
                  statusFilter === filter.key
                    ? 'bg-zinc-100 text-zinc-950'
                    : 'border border-zinc-800 bg-zinc-900/80 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </section>

        {isLoading ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="h-72 animate-pulse rounded-xl border border-zinc-800 bg-zinc-900/50"
              />
            ))}
          </div>
        ) : projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-zinc-800 bg-zinc-900/40 px-6 py-16 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900">
              <ServerCrash className="h-5 w-5 text-zinc-400" />
            </div>
            <h3 className="mt-4 text-sm font-semibold text-zinc-100">
              Nenhum projeto monitorado ainda
            </h3>
            <p className="mt-1 max-w-sm text-xs leading-relaxed text-zinc-400">
              Cadastre seu primeiro serviço para evitar cold starts e acompanhar a latência do
              servidor e banco de dados em tempo real.
            </p>
            <button
              type="button"
              onClick={handleOpenNewProject}
              className="mt-5 inline-flex h-9 items-center gap-1.5 rounded-lg bg-zinc-100 px-4 text-xs font-semibold text-zinc-950 transition-colors hover:bg-zinc-200"
            >
              <Plus className="h-3.5 w-3.5" />
              Cadastrar Primeiro Projeto
            </button>
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 px-6 py-12 text-center text-xs text-zinc-400">
            Nenhum projeto corresponde aos filtros aplicados.
          </div>
        ) : (
          <section className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredProjects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                isPinging={Boolean(pingingIds[project.id]) || (isPingingAll && project.isActive)}
                isToggling={Boolean(togglingIds[project.id])}
                onPing={(id) => void handlePingSingle(id)}
                onToggleActive={(p) => void handleToggleActive(p)}
                onEdit={handleEditProject}
                onDelete={(id) => void handleDeleteProject(id)}
              />
            ))}
          </section>
        )}

        <LogsTable logs={logs} isLoading={isPingingAll} />
      </main>

      <ProjectModal
        isOpen={modalState.isOpen}
        initialData={modalState.project}
        isSubmitting={isSubmittingModal}
        onClose={handleCloseModal}
        onSubmit={handleSaveProject}
      />

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
