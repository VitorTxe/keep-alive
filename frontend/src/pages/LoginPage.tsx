import { Link } from 'react-router-dom';
import { MotionConfig, motion } from 'framer-motion';
import { Activity, ArrowLeft } from 'lucide-react';
import ToastContainer from '../components/Toast';
import LoginForm from '../components/auth/LoginForm';
import { fadeUp, staggerContainer } from '../components/landing/motionPresets';
import { useAuthSession } from '../hooks/useAuthSession';
import { useToast } from '../hooks/useToast';

export default function LoginPage() {
  const { toasts, showToast, dismissToast } = useToast();
  const { isSubmitting, authenticate } = useAuthSession(showToast);

  return (
    <MotionConfig reducedMotion="user">
      <div className="relative flex min-h-screen flex-col justify-between overflow-hidden bg-canvas px-4 py-6 text-fg selection:bg-brand/20 sm:px-6">
        <div
          aria-hidden
          className="bg-grid pointer-events-none absolute inset-0 opacity-60 [mask-image:radial-gradient(ellipse_at_top,black_25%,transparent_75%)]"
        />
        <div
          aria-hidden
          className="glow-brand pointer-events-none absolute left-1/2 top-0 h-96 w-full max-w-3xl -translate-x-1/2"
        />

        <header className="relative mx-auto flex w-full max-w-6xl items-center justify-between">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-xs font-medium text-fg-muted transition-colors hover:text-fg"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Voltar ao início
          </Link>

          <Link to="/" className="flex items-center gap-2 text-sm font-semibold text-fg">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-brand/30 bg-brand/10">
              <Activity className="h-3.5 w-3.5 text-brand" />
            </span>
            Keep-Alive
          </Link>
        </header>

        <main className="relative mx-auto my-10 w-full max-w-md">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerContainer(0.1)}
            className="space-y-6"
          >
            <motion.div variants={fadeUp} className="text-center">
              <span className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1 font-mono text-[11px] uppercase tracking-[0.18em] text-brand">
                <span className="h-1.5 w-1.5 rounded-full bg-brand" />
                Monitoramento & Alertas
              </span>
              <h1 className="text-gradient mt-4 text-2xl font-semibold tracking-tight sm:text-3xl">
                Acesse sua conta
              </h1>
              <p className="mt-2 text-xs leading-relaxed text-fg-muted sm:text-sm">
                Gerencie seus endpoints e receba notificações de status diretamente no seu e-mail.
              </p>
            </motion.div>

            <LoginForm isSubmitting={isSubmitting} onSubmit={authenticate} />
          </motion.div>
        </main>

        <footer className="relative text-center text-[11px] text-fg-subtle">
          Autenticação segura via Supabase Auth · Alertas enviados via Brevo
        </footer>

        <ToastContainer toasts={toasts} onDismiss={dismissToast} />
      </div>
    </MotionConfig>
  );
}
