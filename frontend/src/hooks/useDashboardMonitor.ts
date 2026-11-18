import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  createProject,
  deleteProject,
  fetchProjects,
  fetchRecentLogs,
  pingAllProjects,
  pingProject,
  updateProject,
} from '../services/api';
import type {
  PingLog,
  Project,
  ProjectFormPayload,
  ProjectsSummary,
  ShowToastFn,
  StatusFilterKey,
} from '../types';

export interface ModalState {
  isOpen: boolean;
  project: Project | null;
}

/**
 * Custom Hook que concentra o ciclo de vida, polling de 60s, filtros e mutações
 * do Dashboard, mantendo o componente visual `App.tsx` enxuto e focado em layout.
 */
export function useDashboardMonitor(
  isAuthenticated: boolean,
  showToast: ShowToastFn
) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [summary, setSummary] = useState<ProjectsSummary>({
    totalProjects: 0,
    onlineCount: 0,
    coldStartCount: 0,
    offlineCount: 0,
  });
  const [logs, setLogs] = useState<PingLog[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [isPingingAll, setIsPingingAll] = useState<boolean>(false);
  const [pingingIds, setPingingIds] = useState<Record<string, boolean>>({});
  const [togglingIds, setTogglingIds] = useState<Record<string, boolean>>({});
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<StatusFilterKey>('ALL');
  const [modalState, setModalState] = useState<ModalState>({ isOpen: false, project: null });
  const [isSubmittingModal, setIsSubmittingModal] = useState<boolean>(false);

  const requireAuthenticatedAction = useCallback(
    (actionLabel: string): boolean => {
      if (isAuthenticated) return true;
      showToast({
        type: 'error',
        title: 'Acesso restrito',
        message: `Faça login para ${actionLabel}. Visitantes têm acesso apenas de visualização.`,
      });
      return false;
    },
    [isAuthenticated, showToast]
  );

  const loadDashboardData = useCallback(
    async ({ silent = false }: { silent?: boolean } = {}): Promise<void> => {
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
        const message =
          error instanceof Error
            ? error.message
            : 'Não foi possível conectar à API do Keep-Alive Monitor.';
        showToast({
          type: 'error',
          title: 'Falha ao carregar dados',
          message,
        });
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [showToast]
  );

  useEffect(() => {
    void loadDashboardData({ silent: true });
    const intervalId = window.setInterval(
      () => void loadDashboardData({ silent: true }),
      60000
    );
    return () => window.clearInterval(intervalId);
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

  const handleOpenNewProject = useCallback(() => {
    if (!requireAuthenticatedAction('criar projetos')) return;
    setModalState({ isOpen: true, project: null });
  }, [requireAuthenticatedAction]);

  const handleEditProject = useCallback(
    (project: Project) => {
      if (!requireAuthenticatedAction('editar projetos')) return;
      setModalState({ isOpen: true, project });
    },
    [requireAuthenticatedAction]
  );

  const handleCloseModal = useCallback(() => {
    setModalState({ isOpen: false, project: null });
  }, []);

  const handlePingSingle = useCallback(
    async (projectId: string): Promise<void> => {
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
          message:
            error instanceof Error ? error.message : 'Falha ao executar ping no projeto.',
        });
      } finally {
        setPingingIds((prev) => ({ ...prev, [projectId]: false }));
      }
    },
    [loadDashboardData, requireAuthenticatedAction, showToast]
  );

  const handlePingAll = useCallback(async (): Promise<void> => {
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
        message:
          error instanceof Error ? error.message : 'Não foi possível executar o ping em lote.',
      });
    } finally {
      setIsPingingAll(false);
    }
  }, [loadDashboardData, requireAuthenticatedAction, showToast]);

  const handleToggleActive = useCallback(
    async (project: Project): Promise<void> => {
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
          message:
            error instanceof Error
              ? error.message
              : 'Faça login para atualizar o status do projeto.',
        });
      } finally {
        setTogglingIds((prev) => ({ ...prev, [project.id]: false }));
      }
    },
    [loadDashboardData, requireAuthenticatedAction, showToast]
  );

  const handleSaveProject = useCallback(
    async (formData: ProjectFormPayload): Promise<void> => {
      setIsSubmittingModal(true);
      try {
        if (modalState.project?.id) {
          await updateProject(modalState.project.id, formData);
          showToast({
            type: 'success',
            title: 'Projeto atualizado',
            message: `${formData.name} foi salvo.`,
          });
        } else {
          await createProject(formData);
          showToast({
            type: 'success',
            title: 'Projeto cadastrado',
            message: `${formData.name} adicionado ao monitor.`,
          });
        }
        setModalState({ isOpen: false, project: null });
        await loadDashboardData({ silent: true });
      } catch (error) {
        console.error('[Dashboard] Erro ao salvar projeto:', error);
        showToast({
          type: 'error',
          title: 'Erro ao salvar projeto',
          message:
            error instanceof Error
              ? error.message
              : 'Não foi possível salvar os dados do projeto.',
        });
      } finally {
        setIsSubmittingModal(false);
      }
    },
    [loadDashboardData, modalState.project?.id, showToast]
  );

  const handleDeleteProject = useCallback(
    async (projectId: string): Promise<void> => {
      if (!requireAuthenticatedAction('excluir projetos')) return;

      try {
        await deleteProject(projectId);
        showToast({
          type: 'info',
          title: 'Projeto removido',
          message: 'O projeto e seu histórico foram excluídos.',
        });
        await loadDashboardData({ silent: true });
      } catch (error) {
        console.error(`[Dashboard] Erro ao excluir projeto ${projectId}:`, error);
        showToast({
          type: 'error',
          title: 'Erro ao excluir',
          message:
            error instanceof Error ? error.message : 'Não foi possível excluir o projeto.',
        });
      }
    },
    [loadDashboardData, requireAuthenticatedAction, showToast]
  );

  return {
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
  };
}
