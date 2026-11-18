# Keep-Alive Monitor

Sistema full-stack de monitoramento de disponibilidade, latência e **Keep-Alive** para APIs, aplicações web e bancos de dados, projetado para evitar hibernação e *cold starts* em serviços de hospedagem e instâncias serverless.

## Visão Geral

O **Keep-Alive Monitor** executa verificações HTTP (`GET`) periódicas (via Cron) ou manuais em endpoints cadastrados, classifica automaticamente a saúde do serviço (`ONLINE`, `COLD_START`, `OFFLINE`), registra métricas de latência e tamanho de banco de dados quando expostas pelo alvo e dispara alertas por e-mail em caso de indisponibilidade ou recuperação.

## Índice da Documentação

- [Arquitetura e Fluxos](docs/ARCHITECTURE.md) — Visão em camadas, diagramas Mermaid, motor de ping, autenticação e alertas.
- [Referência da API](docs/API.md) — Endpoints, headers de segurança, payloads e códigos de resposta ([OpenAPI 3.0](docs/openapi.yaml)).
- [Banco de Dados (Supabase)](docs/DATABASE.md) — Schema PostgreSQL, ERD em Mermaid, triggers, índices e estratégia de RLS.
- [Frontend e Interface](docs/FRONTEND.md) — Rotas, componentes, hooks customizados e comunicação com a API.

## Principais Funcionalidades

- **Keep-Alive Automatizado e Manual:** Disparo individual (`POST /api/projects/:id/ping`) ou em lote via Cron (`POST /api/cron/ping-all`) protegido por `CRON_SECRET`.
- **Detecção de Cold Start:** Classificação automática baseada em latência HTTP (`<= 3000 ms` como `ONLINE`, `> 3000 ms` como `COLD_START`, falhas/timeout de `55s` como `OFFLINE`).
- **Suporte a Endpoints Protegidos:** Envio opcional do cabeçalho `x-ping-secret` configurado por projeto.
- **Métricas de Banco de Dados:** Leitura opcional de `dbLatencyMs` e `dbSizeMb` caso o endpoint monitorado retorne JSON com essas propriedades.
- **Alertas Transacionais (Brevo):** Notificação por e-mail quando um projeto fica `OFFLINE` ou se recupera (`OFFLINE` → `ONLINE`).
- **Retenção de Logs:** Limpeza automática de registros em `ping_logs` com mais de 60 dias durante execuções em lote.
- **Autenticação e Modo Visitante:** Cadastro, login e recuperação de senha integrados ao Supabase Auth, com suporte a visualização pública de projetos sem proprietário (`user_id IS NULL`).

## Stack Tecnológica

| Camada | Tecnologias |
| :--- | :--- |
| **Frontend** | React 18, Vite, Tailwind CSS, React Router v7, Framer Motion, Lenis, Lucide React |
| **Backend** | Node.js (ESM), Express 4, `@supabase/supabase-js` |
| **Banco & Auth** | Supabase (PostgreSQL, Supabase Auth, Row Level Security) |
| **E-mail** | Brevo API (`v3/smtp/email`) |

## Estrutura de Diretórios

```text
monitoramento/
├── backend/
│   ├── src/
│   │   ├── config/          # Cliente Supabase (singleton + stateless auth)
│   │   ├── controllers/     # authController, projectController, pingController
│   │   ├── middlewares/     # requireAuth, attachOptionalUser, verifyCronSecret
│   │   ├── repositories/    # projectRepository, pingLogRepository, mappers
│   │   ├── routes/          # Definição das rotas /api/*
│   │   ├── services/        # pingerService e alertService
│   │   └── server.js        # Entrypoint Express e error handler global
│   ├── supabase/
│   │   └── schema.sql       # DDL completo do banco de dados
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/      # Componentes do Dashboard, Auth e Landing Page
│   │   ├── hooks/           # Hooks customizados (sessão, toast, scroll, etc.)
│   │   ├── pages/           # LandingPage, LoginPage, ForgotPasswordPage, ResetPasswordPage
│   │   ├── services/        # Cliente HTTP (api.js)
│   │   ├── utils/           # Formatadores e configuração de status
│   │   ├── App.jsx          # Dashboard principal
│   │   └── main.jsx         # Roteamento React Router
│   └── .env.example
└── docs/                    # Documentação técnica detalhada
```

## Configuração Rápida (Ambiente Local)

### 1. Banco de Dados (Supabase)
1. Crie um projeto no [Supabase](https://supabase.com/).
2. Abra o **SQL Editor** e execute integralmente o script [backend/supabase/schema.sql](backend/supabase/schema.sql).

### 2. Backend
```bash
cd backend
npm install
cp .env.example .env
```

Configure as variáveis em `backend/.env`:

| Variável | Obrigatória | Descrição |
| :--- | :---: | :--- |
| `PORT` | Não | Porta do servidor Express (padrão: `3333`) |
| `SUPABASE_URL` | Sim | URL do projeto Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Sim | Chave `service_role` do Supabase |
| `CRON_SECRET` | Recomendada | Segredo enviado no header `x-cron-secret` para `/api/cron/ping-all` |
| `BREVO_API_KEY` | Não* | Chave de API da Brevo para envio de e-mails |
| `BREVO_SENDER_EMAIL` | Não* | E-mail remetente verificado na Brevo |
| `BREVO_SENDER_NAME` | Não | Nome do remetente (padrão: `Keep-Alive Monitor`) |
| `FRONTEND_URL` | Não | URL base do frontend para links de reset de senha (padrão: `http://localhost:5173`) |
| `PASSWORD_RESET_SECRET` | Não | Segredo HMAC para tokens de reset (fallback: `SUPABASE_SERVICE_ROLE_KEY`) |

*\*Sem `BREVO_API_KEY` e `BREVO_SENDER_EMAIL`, os envios de e-mail são omitidos com aviso no log.*

Inicie o servidor:
```bash
npm run dev   # desenvolvimento com --watch
npm start     # produção
```

### 3. Frontend
```bash
cd frontend
npm install
cp .env.example .env
```

Configure `frontend/.env`:
```env
VITE_API_URL=http://localhost:3333/api
VITE_ADMIN_TOKEN=
```

Inicie o servidor de desenvolvimento:
```bash
npm run dev
```

Para gerar o build de produção:
```bash
npm run build
npm run preview
```
