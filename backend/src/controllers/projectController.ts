import type { NextFunction, Request, Response } from 'express';
import {
  createProjectRecord,
  deleteProjectRecord,
  findAllProjectsWithRecentLogs,
  findProjectById,
  findProjectByIdWithLogs,
  updateProjectRecord,
} from '../repositories/projectRepository.js';
import type { UpdateProjectInput } from '../types/index.js';

interface ProjectMutationBody {
  name?: unknown;
  pingUrl?: unknown;
  secretHeader?: unknown;
  providerInfo?: unknown;
  isActive?: unknown;
}

function isValidHttpUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

export async function getAllProjects(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response | void> {
  try {
    const projects = await findAllProjectsWithRecentLogs(15, req.user?.id ?? null);

    const summary = projects.reduce(
      (acc, project) => {
        if (project.lastStatus === 'ONLINE') acc.onlineCount += 1;
        else if (project.lastStatus === 'OFFLINE') acc.offlineCount += 1;
        else if (project.lastStatus === 'COLD_START') acc.coldStartCount += 1;
        return acc;
      },
      {
        totalProjects: projects.length,
        onlineCount: 0,
        offlineCount: 0,
        coldStartCount: 0,
      }
    );

    return res.status(200).json({
      summary,
      projects,
    });
  } catch (error) {
    console.error('[ProjectController] Erro ao listar projetos:', error);
    return next(error);
  }
}

export async function getProjectById(
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction
): Promise<Response | void> {
  try {
    const { id } = req.params;

    const project = await findProjectByIdWithLogs(id, 50);

    if (!project) {
      return res.status(404).json({ error: 'Projeto não encontrado.' });
    }

    if (project.userId && project.userId !== req.user?.id) {
      return res.status(404).json({ error: 'Projeto não encontrado.' });
    }

    return res.status(200).json(project);
  } catch (error) {
    console.error('[ProjectController] Erro ao buscar projeto por ID:', error);
    return next(error);
  }
}

export async function createProject(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response | void> {
  try {
    const { name, pingUrl, secretHeader, providerInfo, isActive } = (req.body ??
      {}) as ProjectMutationBody;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ error: 'O campo "name" é obrigatório.' });
    }

    if (!pingUrl || typeof pingUrl !== 'string' || !isValidHttpUrl(pingUrl.trim())) {
      return res.status(400).json({
        error: 'O campo "pingUrl" é obrigatório e deve ser uma URL HTTP/HTTPS válida.',
      });
    }

    if (!providerInfo || typeof providerInfo !== 'string' || !providerInfo.trim()) {
      return res.status(400).json({ error: 'O campo "providerInfo" é obrigatório.' });
    }

    const project = await createProjectRecord({
      userId: req.user!.id,
      notificationEmail: req.user!.email,
      name: name.trim(),
      pingUrl: pingUrl.trim(),
      secretHeader:
        typeof secretHeader === 'string' && secretHeader.trim() ? secretHeader.trim() : null,
      providerInfo: providerInfo.trim(),
      isActive: typeof isActive === 'boolean' ? isActive : undefined,
    });

    return res.status(201).json(project);
  } catch (error) {
    console.error('[ProjectController] Erro ao criar projeto:', error);
    return next(error);
  }
}

export async function updateProject(
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction
): Promise<Response | void> {
  try {
    const { id } = req.params;
    const { name, pingUrl, secretHeader, providerInfo, isActive } = (req.body ??
      {}) as ProjectMutationBody;

    const existing = await findProjectById(id);
    if (!existing) {
      return res.status(404).json({ error: 'Projeto não encontrado.' });
    }

    if (existing.userId !== req.user?.id) {
      return res.status(403).json({
        error: 'Você não tem permissão para editar este projeto.',
      });
    }

    const dataToUpdate: UpdateProjectInput = {};

    if (name !== undefined) {
      if (typeof name !== 'string' || !name.trim()) {
        return res.status(400).json({ error: 'O campo "name" não pode ser vazio.' });
      }
      dataToUpdate.name = name.trim();
    }

    if (pingUrl !== undefined) {
      if (typeof pingUrl !== 'string' || !isValidHttpUrl(pingUrl.trim())) {
        return res.status(400).json({
          error: 'O campo "pingUrl" deve ser uma URL HTTP/HTTPS válida.',
        });
      }
      dataToUpdate.pingUrl = pingUrl.trim();
    }

    if (secretHeader !== undefined) {
      dataToUpdate.secretHeader =
        typeof secretHeader === 'string' && secretHeader.trim() ? secretHeader.trim() : null;
    }

    if (providerInfo !== undefined) {
      if (typeof providerInfo !== 'string' || !providerInfo.trim()) {
        return res.status(400).json({ error: 'O campo "providerInfo" não pode ser vazio.' });
      }
      dataToUpdate.providerInfo = providerInfo.trim();
    }

    if (isActive !== undefined) {
      if (typeof isActive !== 'boolean') {
        return res.status(400).json({ error: 'O campo "isActive" deve ser booleano.' });
      }
      dataToUpdate.isActive = isActive;
    }

    const updatedProject = await updateProjectRecord(id, dataToUpdate);

    return res.status(200).json(updatedProject);
  } catch (error) {
    console.error('[ProjectController] Erro ao atualizar projeto:', error);
    return next(error);
  }
}

export async function deleteProject(
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction
): Promise<Response | void> {
  try {
    const { id } = req.params;

    const existing = await findProjectById(id);
    if (!existing) {
      return res.status(404).json({ error: 'Projeto não encontrado.' });
    }

    if (existing.userId !== req.user?.id) {
      return res.status(403).json({
        error: 'Você não tem permissão para remover este projeto.',
      });
    }

    await deleteProjectRecord(id);

    return res.status(200).json({ message: 'Projeto removido com sucesso.' });
  } catch (error) {
    console.error('[ProjectController] Erro ao remover projeto:', error);
    return next(error);
  }
}
