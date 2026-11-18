# Frontend e Interface

O frontend é uma Single Page Application (SPA) construída com **React 18**, **TypeScript (`strict`)**, **Vite** e **Tailwind CSS**.

## Rotas da Aplicação ([main.tsx](../frontend/src/main.tsx))

| Rota | Página / Componente | Descrição |
| :--- | :--- | :--- |
| `/` | `LandingPage` | Página institucional com apresentação do produto, Bento Grid, snippets de código e CTA |
| `/login` | `LoginPage` | Autenticação e cadastro de novos usuários |
| `/forgot-password` | `ForgotPasswordPage` | Solicitação de e-mail para recuperação de senha |
| `/reset-password` | `ResetPasswordPage` | Formulário de definição de nova senha a partir do token na URL |
| `/dashboard` | `App` | Painel principal de monitoramento em tempo real |
| `*` | `Navigate` | Redireciona rotas desconhecidas para `/` |

## Estrutura de Componentes

### Dashboard (`frontend/src/components/`)
- **`Header.tsx`**: Barra superior com ações de atualização, ping em lote, criação de projeto e controle de sessão (login/logout).
- **`StatsOverview.tsx`**: Cartões de resumo com contagem de projetos totais, `ONLINE`, `COLD_START` e `OFFLINE`.
- **`ProjectCard.tsx`**: Card individual de projeto exibindo provedor, status atual, última latência e botões de ação (pingar, pausar/ativar, editar, excluir).
- **`ProjectMetricsPanel.tsx`**: Subcomponente de telemetria do card (latência HTTP, latência DB com tooltip, uso de armazenamento e sparkline).
- **`LatencySparkline.tsx`**: Visualização gráfica das latências recentes do projeto.
- **`ProjectModal.tsx`**: Modal para criação e edição de projetos monitorados.
- **`LogsTable.tsx`**: Tabela cronológica dos logs de execução recentes (status HTTP, latência HTTP/DB, tipo de gatilho e mensagens de erro).
- **`ErrorLogModal.tsx`**: Modal dedicado para inspeção detalhada de erros de rede/HTTP.
- **`Toast.tsx`**: Sistema de notificações visuais (`ToastContainer`).

### Landing Page (`frontend/src/components/landing/`)
Composta por seções modulares animadas com **Framer Motion** e rolagem suave via **Lenis**:
- `LandingNavbar.tsx`, `HeroSection.tsx`, `HeroMonitorPreview.tsx`, `ProvidersMarquee.tsx`, `FeaturesBento.tsx`, `BentoHighlightVisual.tsx`, `HowItWorksSection.tsx`, `CodeTabs.tsx`, `UptimeSection.tsx`, `CtaSection.tsx`, `LandingFooter.tsx`, além de utilitários como `SpotlightCard.tsx`, `SectionHeading.tsx`, `MiniBars.tsx` e `motionPresets.ts`.

## Hooks Customizados (`frontend/src/hooks/`)

- **`useDashboardMonitor.ts`**: Concentra o ciclo de vida, polling de 60s, filtros e mutações do Dashboard.
- **`useAuthSession.ts`**: Gerencia o estado do usuário autenticado, leitura/persistência de `AUTH_TOKEN` no `localStorage` e validação da sessão via `/api/auth/me`.
- **`useToast.ts`**: Gerencia a fila e remoção automática de notificações toast.
- **`useCopyToClipboard.ts`**: Utilitário para cópia de snippets/URLs para a área de transferência.
- **`useLiveLatencyFeed.ts`**: Alimenta visualizações de latência em tempo real na Landing Page.
- **`useSmoothScroll.ts`**: Integra o comportamento de scroll suave com `lenis`.

## Comunicação com a API ([services/api.ts](../frontend/src/services/api.ts))

- Utiliza `VITE_API_URL` (padrão `http://localhost:3333`) como base das requisições e lança `ApiClientError` tipado em falhas HTTP.
- Injeta automaticamente `Authorization: Bearer <AUTH_TOKEN>` quando o usuário está autenticado.
- Para o disparo em lote (`pingAllProjects`), lê `CRON_SECRET` do `localStorage` ou argumento opcional e envia no cabeçalho `x-cron-secret`.
- O Dashboard (`App.tsx` via `useDashboardMonitor.ts`) executa polling automático a cada **60 segundos** (`setInterval(..., 60000)`) para manter os dados atualizados.
- Visitantes não autenticados podem visualizar o dashboard em modo somente leitura; tentativas de criar, editar, excluir ou pingar exibem um toast solicitando login.
