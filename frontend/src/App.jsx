import { useCallback, useEffect, useMemo, useState } from 'react';
import { Plus, Search, ServerCrash } from 'lucide-react';
import Header from './components/Header';
import LogsTable from './components/LogsTable';
import ProjectCard from './components/ProjectCard';
import ProjectModal from './components/ProjectModal';
import StatsOverview from './components/StatsOverview';
import ToastContainer from './components/Toast';
import { useAuthSession } from './hooks/useAuthSession';
import { useToast } from './hooks/useToast';
import {
  createProject,
  deleteProject,
  fetchProjects,
  fetchRecentLogs,
  pingAllProjects,
  pingProject,
  updateProject,
} from './services/api';

const STATUS_FILTERS = [
  { key: 'ALL', label: 'Todos' },
  { key: 'ONLINE', label: 'Online' },
  { key: 'COLD_START', label: 'Cold Start' },
  { key: 'OFFLINE', label: 'Offline' },
];

export default function App() {
  const [projects, setProjects] = useState([]);
  const [summary, setSummary] = useState({
    totalProjects: 0,
    onlineCount: 0,
    coldStartCount: 0,
    offlineCount: 0,
  });
  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isPingingAll, setIsPingingAll] = useState(false);
  const [pingingIds, setPingingIds] = useState({});
  const [togglingIds, setTogglingIds] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [modalState, setModalState] = useState({ isOpen: false, project: null });
  const [isSubmittingModal, setIsSubmittingModal] = useState(false);

  const { toasts, showToast, dismissToast } = useToast();
  const { user, isAuthenticated, signOut } = useAuthSession(showToast);

  function requireAuthenticatedAction(actionLabel) {
    if (isAuthenticated) return true;
    showToast({
      type: 'error',
      title: 'Acesso restrito',
      message: `Faça login para ${actionLabel}. Visitantes têm acesso apenas de visualização.`,
    });
    return false;
  }

  function handleOpenNewProject() {
    if (!requireAuthenticatedAction('criar projetos')) return;
    setModalState({ isOpen: true, project: null });
  }

  function handleEditProject(project) {
    if (!requireAuthenticatedAction('editar projetos')) return;
    setModalState({ isOpen: true, project });
  }

  const loadDashboardData = useCallback(
    async ({ silent = false } = {}) => {
      if (!silent) setIsRefreshing(true);
      try {
        const [projectsPayload, logsPayload] = await Promise.all([
          fetchProjects(),
          fetchRecentLogs(),
        ]);
        setProjects(projectsPayload?.projects || []);
        setSummary(
          projectsPayload?.summary || {
            totalProjects: 0,
            onlineCount: 0,
            coldStartCount: 0,
            offlineCount: 0,
          }
        );
        setLogs(Array.isArray(logsPayload) ? logsPayload : []);
      } catch (error) {
        console.error('[Dashboard] Erro ao carregar dados do monitoramento:', error);
        showToast({
          type: 'error',
          title: 'Falha ao carregar dados',
          message: error.message || 'Não foi possível conectar à API do Keep-Alive Monitor.',
        });
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [showToast]
  );

  useEffect(() => {
    loadDashboardData({ silent: true });
    const intervalId = setInterval(() => loadDashboardData({ silent: true }), 60000);
    return () => clearInterval(intervalId);
  }, [loadDashboardData]);

  const filteredProjects = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return projects.filter((project) => {
      const matchesStatus = statusFilter === 'ALL' || project.lastStatus === statusFilter;
      const matchesQuery =
        !query ||
        project.name.toLowerCase().includes(query) ||
        project.providerInfo.toLowerCase().includes(query);
      return matchesStatus && matchesQuery;
    });
  }, [projects, searchQuery, statusFilter]);

  async function handlePingSingle(projectId) {
    if (!requireAuthenticatedAction('pingar projetos')) return;

    setPingingIds((prev) => ({ ...prev, [projectId]: true }));
    try {
      const result = await pingProject(projectId);
      showToast({
        type: result?.log?.status === 'OFFLINE' ? 'error' : 'success',
        title: 'Ping executado',
        message: `Status: ${result?.log?.status || 'Concluído'} (${result?.log?.httpLatencyMs ?? 0} ms)`,
      });
      await loadDashboardData({ silent: true });
    } catch (error) {
      console.error(`[Dashboard] Erro ao pingar projeto ${projectId}:`, error);
      showToast({
        type: 'error',
        title: 'Erro no ping manual',
        message: error.message || 'Falha ao executar ping no projeto.',
      });
    } finally {
      setPingingIds((prev) => ({ ...prev, [projectId]: false }));
    }
  }

  async function handlePingAll() {
    if (!requireAuthenticatedAction('pingar todos os projetos')) return;

    setIsPingingAll(true);
    try {
      const result = await pingAllProjects();
      showToast({
        type: 'success',
        title: 'Ping em lote concluído',
        message: `${result?.total ?? 0} projeto(s) verificados.`,
      });
      await loadDashboardData({ silent: true });
    } catch (error) {
      console.error('[Dashboard] Erro ao executar ping em lote:', error);
      showToast({
        type: 'error',
        title: 'Erro ao pingar todos',
        message: error.message || 'Verifique o CRON_SECRET configurado.',
      });
    } finally {
      setIsPingingAll(false);
    }
  }

  async function handleToggleActive(project) {
    if (!requireAuthenticatedAction('editar projetos')) return;

    setTogglingIds((prev) => ({ ...prev, [project.id]: true }));
    try {
      await updateProject(project.id, { isActive: !project.isActive });
      showToast({
        type: 'info',
        title: project.isActive ? 'Projeto pausado' : 'Projeto ativado',
        message: `${project.name} foi ${project.isActive ? 'pausado' : 'reativado'} com sucesso.`,
      });
      await loadDashboardData({ silent: true });
    } catch (error) {
      console.error(`[Dashboard] Erro ao alternar status do projeto ${project.id}:`, error);
      showToast({
        type: 'error',
        title: 'Falha ao atualizar status',
        message: error.message || 'Faça login para atualizar o status do projeto.',
      });
    } finally {
      setTogglingIds((prev) => ({ ...prev, [project.id]: false }));
    }
  }

  async function handleSaveProject(formData) {
    setIsSubmittingModal(true);
    try {
      if (modalState.project?.id) {
        await updateProject(modalState.project.id, formData);
        showToast({ type: 'success', title: 'Projeto atualizado', message: `${formData.name} foi salvo.` });
      } else {
        await createProject(formData);
        showToast({ type: 'success', title: 'Projeto cadastrado', message: `${formData.name} adicionado ao monitor.` });
      }
      setModalState({ isOpen: false, project: null });
      await loadDashboardData({ silent: true });
    } catch (error) {
      console.error('[Dashboard] Erro ao salvar projeto:', error);
      showToast({
        type: 'error',
        title: 'Erro ao salvar projeto',
        message: error.message || 'Não foi possível salvar os dados do projeto.',
      });
    } finally {
      setIsSubmittingModal(false);
    }
  }

  async function handleDeleteProject(projectId) {
    if (!requireAuthenticatedAction('excluir projetos')) return;

    try {
      await deleteProject(projectId);
      showToast({ type: 'info', title: 'Projeto removido', message: 'O projeto e seu histórico foram excluídos.' });
      await loadDashboardData({ silent: true });
    } catch (error) {
      console.error(`[Dashboard] Erro ao excluir projeto ${projectId}:`, error);
      showToast({
        type: 'error',
        title: 'Erro ao excluir',
        message: error.message || 'Não foi possível excluir o projeto.',
      });
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <Header
        user={user}
        isAuthenticated={isAuthenticated}
        isPingingAll={isPingingAll}
        isRefreshing={isRefreshing}
        offlineCount={summary.offlineCount}
        onPingAll={handlePingAll}
        onNewProject={handleOpenNewProject}
        onRefresh={() => loadDashboardData()}
        onSignOut={signOut}
      />

      <main className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <StatsOverview summary={summary} />

        {/* Barra de Busca e Filtros */}
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

        {/* Grid de Projetos ou Empty State */}
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
              Cadastre seu primeiro serviço para evitar cold starts e acompanhar a latência do servidor e banco de dados em tempo real.
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
                onPing={handlePingSingle}
                onToggleActive={handleToggleActive}
                onEdit={handleEditProject}
                onDelete={handleDeleteProject}
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
        onClose={() => setModalState({ isOpen: false, project: null })}
        onSubmit={handleSaveProject}
      />

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
