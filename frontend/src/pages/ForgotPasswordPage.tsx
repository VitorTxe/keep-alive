import { type FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';
import { MotionConfig, motion } from 'framer-motion';
import { Activity, ArrowLeft, ArrowRight, CheckCircle2, Loader2, Mail } from 'lucide-react';
import ToastContainer from '../components/Toast';
import { fadeUp, staggerContainer } from '../components/landing/motionPresets';
import { useToast } from '../hooks/useToast';
import { requestPasswordReset } from '../services/api';

export default function ForgotPasswordPage() {
  const { toasts, showToast, dismissToast } = useToast();
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setIsSubmitting(true);
    try {
      const result = await requestPasswordReset(email.trim());
      setSent(true);
      showToast({
        type: 'success',
        title: 'Solicitação enviada',
        message: result?.message || 'Verifique sua caixa de entrada (ou Spam).',
      });
    } catch (error) {
      console.error('[ForgotPasswordPage] Erro ao solicitar redefinição de senha:', error);
      showToast({
        type: 'error',
        title: 'Erro ao enviar solicitação',
        message:
          error instanceof Error ? error.message : 'Não foi possível processar o pedido.',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

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
            to="/login"
            className="inline-flex items-center gap-2 text-xs font-medium text-fg-muted transition-colors hover:text-fg"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Voltar ao login
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
              <h1 className="text-gradient text-2xl font-semibold tracking-tight sm:text-3xl">
                Recuperar senha
              </h1>
              <p className="mt-2 text-xs leading-relaxed text-fg-muted sm:text-sm">
                Informe o e-mail da sua conta para receber um link de redefinição.
              </p>
            </motion.div>

            <motion.div
              variants={fadeUp}
              className="rounded-2xl border border-line bg-surface/90 p-6 shadow-2xl shadow-canvas backdrop-blur-xl sm:p-7"
            >
              {sent ? (
                <div className="space-y-4 text-center">
                  <CheckCircle2 className="mx-auto h-8 w-8 text-brand" />
                  <p className="text-xs leading-relaxed text-fg-muted">
                    Se <strong className="text-fg">{email}</strong> estiver cadastrado, enviamos o
                    link de redefinição (válido por 15 minutos). Confira também a caixa de Spam.
                  </p>
                  <Link
                    to="/login"
                    className="inline-flex h-10 w-full items-center justify-center rounded-xl bg-fg px-4 text-xs font-semibold text-canvas hover:opacity-90"
                  >
                    Voltar para o login
                  </Link>
                </div>
              ) : (
                <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
                  <div>
                    <label
                      htmlFor="forgot-email"
                      className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-fg"
                    >
                      <Mail className="h-3.5 w-3.5 text-brand" />
                      E-mail cadastrado *
                    </label>
                    <input
                      id="forgot-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="voce@exemplo.com"
                      required
                      className="h-10 w-full rounded-xl border border-line bg-canvas px-3.5 text-xs text-fg placeholder-fg-subtle focus:border-brand/60 focus:outline-none"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="group inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-fg px-4 text-xs font-semibold text-canvas hover:opacity-90 disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Enviando...</span>
                      </>
                    ) : (
                      <>
                        <span>Enviar link de redefinição</span>
                        <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                      </>
                    )}
                  </button>
                </form>
              )}
            </motion.div>
          </motion.div>
        </main>

        <footer className="relative text-center text-[11px] text-fg-subtle">
          Keep-Alive Monitor · Recuperação de acesso
        </footer>

        <ToastContainer toasts={toasts} onDismiss={dismissToast} />
      </div>
    </MotionConfig>
  );
}
