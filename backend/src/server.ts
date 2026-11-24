import 'dotenv/config';
import cors, { type CorsOptions } from 'cors';
import express, { type NextFunction, type Request, type Response } from 'express';
import routes from './routes/index.js';
import type { HttpError } from './types/index.js';

const app = express();
const PORT = Number(process.env.PORT) || 3333;

const normalizeOrigin = (value: string): string => value.trim().replace(/\/$/, '');

const buildAllowedOrigins = (): Set<string> => {
  const configuredOrigins = [
    process.env.FRONTEND_URL,
    ...(process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : []),
  ]
    .filter((origin): origin is string => Boolean(origin && origin.trim()))
    .map(normalizeOrigin);

  const devOrigins =
    process.env.NODE_ENV !== 'production'
      ? [
          'http://localhost:5174',
        ]
      : [];

  return new Set([...configuredOrigins, ...devOrigins]);
};

const allowedOrigins = buildAllowedOrigins();

const corsOptions: CorsOptions = {
  origin: (requestOrigin, callback) => {
    // Permite chamadas sem Origin (ex: cron jobs, healthchecks, curl e server-to-server)
    if (!requestOrigin) {
      callback(null, true);
      return;
    }

    if (allowedOrigins.has(normalizeOrigin(requestOrigin))) {
      callback(null, true);
      return;
    }

    const corsError: HttpError = new Error(
      `Origem não permitida pelo CORS: ${requestOrigin}`
    );
    corsError.statusCode = 403;
    callback(corsError);
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-cron-secret'],
  credentials: true,
  optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
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
