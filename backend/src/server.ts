import 'dotenv/config';
import cors from 'cors';
import express, { type NextFunction, type Request, type Response } from 'express';
import routes from './routes/index.js';
import type { HttpError } from './types/index.js';

const app = express();
const PORT = Number(process.env.PORT) || 3333;

app.use(cors());
app.use(express.json());

app.use('/api', routes);

app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: `Rota não encontrada: ${req.method} ${req.originalUrl}`,
  });
});

/**
 * Error Handler Global: captura exceções assíncronas encaminhadas via `next(error)`
 * e oculta detalhes internos de stack/banco quando `NODE_ENV === 'production'`.
 */
app.use((err: HttpError, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[GlobalErrorHandler] Erro não tratado:', err);

  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    error: statusCode === 500 ? 'Erro interno do servidor.' : err.message,
    ...(process.env.NODE_ENV !== 'production' ? { details: err.message } : {}),
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor Keep-Alive rodando na porta ${PORT}`);
});
