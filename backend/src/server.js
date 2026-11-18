import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import { apiRateLimiter } from './middlewares/rateLimitMiddleware.js';
import routes from './routes/index.js';

const app = express();
const PORT = Number(process.env.PORT) || 3333;

const DEV_ORIGINS = ['http://localhost:5173', 'http://127.0.0.1:5173'];

function buildAllowedOrigins() {
  const envOrigins = [process.env.FRONTEND_URL, ...(process.env.CORS_ORIGINS || '').split(',')]
    .map((origin) => origin?.trim().replace(/\/$/, ''))
    .filter(Boolean);

  const origins =
    process.env.NODE_ENV === 'production' ? envOrigins : [...envOrigins, ...DEV_ORIGINS];

  return new Set(origins);
}

const allowedOrigins = buildAllowedOrigins();

app.set('trust proxy', 1);
app.use(
  cors({
    origin(origin, callback) {
      // Permite requisições sem Origin (GitHub Actions cron, curl, health checks)
      if (!origin || allowedOrigins.has(origin.replace(/\/$/, ''))) {
        return callback(null, true);
      }

      console.warn(`[CORS] Origem bloqueada: ${origin}`);
      const err = new Error('Origem não permitida pela política de CORS.');
      err.statusCode = 403;
      return callback(err);
    },
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-cron-secret'],
  })
);
app.use(express.json());

app.use('/api', apiRateLimiter, routes);

app.use((req, res) => {
  res.status(404).json({
    error: `Rota não encontrada: ${req.method} ${req.originalUrl}`,
  });
});

app.use((err, req, res, _next) => {
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
