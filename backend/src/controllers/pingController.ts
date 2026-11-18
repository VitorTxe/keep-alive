import type { NextFunction, Request, Response } from 'express';
import { findRecentPingLogs } from '../repositories/pingLogRepository.js';
import { findProjectById } from '../repositories/projectRepository.js';
import { pingAllActiveProjects, pingSingleProject } from '../services/pingerService.js';

export async function triggerSinglePing(
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction
): Promise<Response | void> {
  try {
    const { id } = req.params;

    const project = await findProjectById(id);
    if (!project) {
      return res.status(404).json({ error: 'Projeto não encontrado.' });
    }

    const result = await pingSingleProject(project, 'MANUAL');

    return res.status(200).json({
      message: 'Ping manual executado com sucesso.',
      ...result,
    });
  } catch (error) {
    console.error('[PingController] Erro ao executar ping manual:', error);
    return next(error);
  }
}

export async function triggerCronPingAll(
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<Response | void> {
  try {
    const summary = await pingAllActiveProjects('CRON');

    return res.status(200).json({
      message: 'Execução em lote finalizada.',
      ...summary,
    });
  } catch (error) {
    console.error('[PingController] Erro ao executar ping em lote (CRON):', error);
    return next(error);
  }
}

export async function getRecentLogs(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response | void> {
  try {
    const logs = await findRecentPingLogs(30, req.user?.id ?? null);

    return res.status(200).json(logs);
  } catch (error) {
    console.error('[PingController] Erro ao buscar logs recentes:', error);
    return next(error);
  }
}
