# Frontend e Interface

O frontend é uma Single Page Application (SPA) construída com **React 18**, **Vite** e **Tailwind CSS**.

## Rotas da Aplicação ([main.jsx](../frontend/src/main.jsx))

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
- **`Header.jsx`**: Barra superior com ações de atualização, ping em lote, criação de projeto e controle de sessão (login/logout).
- **`StatsOverview.jsx`**: Cartões de resumo com contagem de projetos totais, `ONLINE`, `COLD_START` e `OFFLINE`.
- **`ProjectCard.jsx`**: Card individual de projeto exibindo provedor, status atual, última latência, tamanho do banco (`dbSizeMb`), gráfico sparkline e botões de ação (pingar, pausar/ativar, editar, excluir).
- **`LatencySparkline.jsx`**: Visualização gráfica das latências recentes do projeto.
- **`ProjectModal.jsx`**: Modal para criação e edição de projetos monitorados.
- **`LogsTable.jsx`**: Tabela cronológica dos logs de execução recentes (status HTTP, latência HTTP/DB, tipo de gatilho e mensagens de erro).
- **`Toast.jsx`**: Sistema de notificações visuais (`ToastContainer`).

### Landing Page (`frontend/src/components/landing/`)
Composta por seções modulares animadas com **Framer Motion** e rolagem suave via **Lenis**:
- `LandingNavbar.jsx`, `HeroSection.jsx`, `HeroMonitorPreview.jsx`, `ProvidersMarquee.jsx`, `FeaturesBento.jsx`, `BentoHighlightVisual.jsx`, `HowItWorksSection.jsx`, `CodeTabs.jsx`, `UptimeSection.jsx`, `CtaSection.jsx`, `LandingFooter.jsx`, além de utilitários como `SpotlightCard.jsx`, `SectionHeading.jsx`, `MiniBars.jsx` e `motionPresets.js`.

## Hooks Customizados (`frontend/src/hooks/`)

- **`useAuthSession.js`**: Gerencia o estado do usuário autenticado, leitura/persistência de `AUTH_TOKEN` no `localStorage` e validação da sessão via `/api/auth/me`.
- **`useToast.js`**: Gerencia a fila e remoção automática de notificações toast.
- **`useCopyToClipboard.js`**: Utilitário para cópia de snippets/URLs para a área de transferência.
- **`useLiveLatencyFeed.js`**: Alimenta visualizações de latência em tempo real na Landing Page.
- **`useSmoothScroll.js`**: Integra o comportamento de scroll suave com `lenis`.

## Comunicação com a API ([services/api.js](../frontend/src/services/api.js))

- Utiliza `VITE_API_URL` (padrão `http://localhost:3333`) como base das requisições.
- Injeta automaticamente `Authorization: Bearer <AUTH_TOKEN>` quando o usuário está autenticado.
- Para o disparo em lote (`pingAllProjects`), lê `CRON_SECRET` do `localStorage` ou argumento opcional e envia no cabeçalho `x-cron-secret`.
- O Dashboard (`App.jsx`) executa polling automático a cada **60 segundos** (`setInterval(..., 60000)`) para manter os dados atualizados.
- Visitantes não autenticados podem visualizar o dashboard em modo somente leitura; tentativas de criar, editar, excluir ou pingar exibem um toast solicitando login.
