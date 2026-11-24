import cors, { type CorsOptions } from 'cors';
import express, { type NextFunction, type Request, type Response } from 'express';
import { apiRateLimiter } from './middlewares/rateLimitMiddleware.js';
import routes from './routes/index.js';
import type { HttpError } from './types/index.js';

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
          'http://localhost:5173',
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

const app = express();

// Garante identificação correta do IP do cliente atrás de proxies reversos (Render, Railway, Nginx, etc.)
app.set('trust proxy', 1);

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(express.json());

app.use('/api', apiRateLimiter, routes);

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
  const statusCode = err.statusCode || 500;

  if (statusCode >= 500) {
    console.error('[GlobalErrorHandler] Erro não tratado:', err);
  }

  res.status(statusCode).json({
    error: statusCode === 500 ? 'Erro interno do servidor.' : err.message,
    ...(process.env.NODE_ENV !== 'production' ? { details: err.message } : {}),
  });
});

export default app;
