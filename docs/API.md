# Referência da API REST

Todas as rotas estão montadas sob o prefixo `/api` (definido em [backend/src/server.ts](../backend/src/server.ts)).

> A especificação formal em formato **OpenAPI 3.0** está disponível em [openapi.yaml](openapi.yaml) e pode ser importada diretamente no Postman, Insomnia ou Swagger Editor.

## Autenticação e Headers

- **Rotas autenticadas:** Enviar `Authorization: Bearer <accessToken>`.
- **Rota de Cron:** Enviar `x-cron-secret: <CRON_SECRET>`.
- **Formato:** Todas as requisições e respostas utilizam `application/json`.

---

## Healthcheck

### `GET /api/health`
Verifica se a API está em execução.

**Resposta `200 OK`:**
```json
{
  "status": "ok",
  "service": "monitoramento-keep-alive",
  "uptimeSeconds": 120,
  "timestamp": "2026-11-18T12:00:00.000Z"
}
```

---

## Autenticação (`/api/auth`)

### `POST /api/auth/register`
Cria uma nova conta no Supabase Auth (já confirmada), sincroniza em `public.users` e retorna a sessão inicial.

**Body:**
```json
{
  "email": "usuario@exemplo.com",
  "password": "******"
}
```
- Validação: e-mail válido e senha com no mínimo 6 caracteres.
- **Respostas:** `201 Created` (`{ user, accessToken, refreshToken }`), `400 Bad Request`, `409 Conflict` (e-mail já cadastrado).

### `POST /api/auth/login`
Autentica um usuário existente.

**Body:**
```json
{
  "email": "usuario@exemplo.com",
  "password": "******"
}
```
- **Respostas:** `200 OK` (`{ user, accessToken, refreshToken }`), `400 Bad Request`, `401 Unauthorized`.

### `GET /api/auth/me`
Retorna os dados do usuário autenticado. Requer `requireAuth`.

- **Respostas:** `200 OK` (`{ user: { id, email } }`), `401 Unauthorized`.

### `POST /api/auth/forgot-password`
Solicita link de redefinição de senha (enviado por e-mail via Brevo caso a conta exista).

**Body:**
```json
{
  "email": "usuario@exemplo.com"
}
```
- **Respostas:** `200 OK`, `400 Bad Request`.

### `POST /api/auth/reset-password`
Redefine a senha utilizando o token HMAC recebido por e-mail.

**Body:**
```json
{
  "token": "<payload.signature>",
  "password": "nova_senha_min_6_chars"
}
```
- **Respostas:** `200 OK`, `400 Bad Request` (token inválido/expirado ou senha curta).

---

## Projetos (`/api/projects`)

### `GET /api/projects`
Lista projetos com os últimos 15 logs de cada projeto e um resumo consolidado. Usa `attachOptionalUser`.
- Visitantes veem apenas projetos com `user_id IS NULL`.
- Usuários autenticados veem seus projetos e os públicos (`user_id IS NULL`).

**Resposta `200 OK`:**
```json
{
  "summary": {
    "totalProjects": 2,
    "onlineCount": 1,
    "offlineCount": 0,
    "coldStartCount": 1
  },
  "projects": []
}
```

### `GET /api/projects/:id`
Retorna os detalhes de um projeto e até 50 logs recentes. Usa `attachOptionalUser`.
- **Respostas:** `200 OK`, `404 Not Found` (ou quando pertence a outro usuário).

### `POST /api/projects`
Cria um novo projeto monitorado vinculado ao usuário autenticado (`notificationEmail` é preenchido com o e-mail do usuário). Requer `requireAuth`.

**Body:**
```json
{
  "name": "API Principal",
  "pingUrl": "https://minha-api.onrender.com/health",
  "providerInfo": "Render + Supabase",
  "secretHeader": "opcional-segredo",
  "isActive": true
}
```
- **Respostas:** `201 Created`, `400 Bad Request`, `401 Unauthorized`.

### `PATCH /api/projects/:id`
Atualiza parcialmente um projeto (`name`, `pingUrl`, `secretHeader`, `providerInfo`, `isActive`). Requer `requireAuth` e propriedade do projeto.
- **Respostas:** `200 OK`, `400 Bad Request`, `403 Forbidden`, `404 Not Found`.

### `DELETE /api/projects/:id`
Remove um projeto e seus logs em cascata. Requer `requireAuth` e propriedade do projeto.
- **Respostas:** `200 OK`, `403 Forbidden`, `404 Not Found`.

### `POST /api/projects/:id/ping`
Dispara um ping imediato (`triggerType = 'MANUAL'`) para o projeto especificado. Requer `requireAuth`.
- **Respostas:** `200 OK` (`{ message, project, log }`), `404 Not Found`.

---

## Monitoramento e Cron

### `GET /api/logs`
Retorna os 30 logs mais recentes respeitando a visibilidade do usuário (`attachOptionalUser`).
- **Respostas:** `200 OK`.

### `POST /api/cron/ping-all`
Executa ping paralelo em todos os projetos ativos (`is_active = true`) com `triggerType = 'CRON'` e limpa logs com mais de 60 dias. Protegido por `verifyCronSecret`.

**Resposta `200 OK`:**
```json
{
  "message": "Execução em lote finalizada.",
  "total": 5,
  "online": 4,
  "cold_start": 1,
  "offline": 0,
  "failedExecutions": 0,
  "cleanedLogsCount": 12,
  "details": []
}
```
