import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import { apiRateLimiter } from './middlewares/rateLimitMiddleware.js';
import routes from './routes/index.js';

const app = express();
const PORT = Number(process.env.PORT) || 3333;

app.set('trust proxy', 1);
app.use(cors());
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
