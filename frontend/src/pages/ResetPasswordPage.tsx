import { type FormEvent, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { MotionConfig, motion } from 'framer-motion';
import { Activity, ArrowLeft, Eye, EyeOff, Loader2, Lock } from 'lucide-react';
import ToastContainer from '../components/Toast';
import { fadeUp, staggerContainer } from '../components/landing/motionPresets';
import { useToast } from '../hooks/useToast';
import { confirmPasswordReset } from '../services/api';

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toasts, showToast, dismissToast } = useToast();

  // Token de redefinição lido diretamente via query param (?token=...)
  const token = searchParams.get('token') || '';
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();

    if (!token) {
      showToast({
        type: 'error',
        title: 'Link inválido',
        message: 'Token de redefinição ausente. Solicite um novo link.',
      });
      return;
    }

    if (password !== confirmPassword) {
      showToast({
        type: 'error',
        title: 'Senhas diferentes',
        message: 'As duas senhas digitadas precisam ser iguais.',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await confirmPasswordReset({ token, password });
      showToast({
        type: 'success',
        title: 'Senha atualizada',
        message: result?.message || 'Você já pode entrar com a nova senha.',
      });
      navigate('/login');
    } catch (error) {
      console.error('[ResetPasswordPage] Erro ao redefinir senha:', error);
      showToast({
        type: 'error',
        title: 'Erro ao redefinir senha',
        message: error instanceof Error ? error.message : 'Link inválido ou expirado.',
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
                Criar nova senha
              </h1>
              <p className="mt-2 text-xs leading-relaxed text-fg-muted sm:text-sm">
                Defina uma nova senha de acesso para a sua conta.
              </p>
            </motion.div>

            <motion.form
              variants={fadeUp}
              onSubmit={(e) => void handleSubmit(e)}
              className="space-y-4 rounded-2xl border border-line bg-surface/90 p-6 shadow-2xl shadow-canvas backdrop-blur-xl sm:p-7"
            >
              <div>
                <label
                  htmlFor="new-password"
                  className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-fg"
                >
                  <Lock className="h-3.5 w-3.5 text-brand" />
                  Nova senha *
                </label>
                <div className="relative">
                  <input
                    id="new-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mínimo de 6 caracteres"
                    minLength={6}
                    required
                    className="h-10 w-full rounded-xl border border-line bg-canvas pl-3.5 pr-10 text-xs text-fg placeholder-fg-subtle focus:border-brand/60 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-fg-subtle hover:text-fg"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="confirm-password" className="mb-1.5 block text-xs font-medium text-fg">
                  Confirmar nova senha *
                </label>
                <input
                  id="confirm-password"
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repita a nova senha"
                  minLength={6}
                  required
                  className="h-10 w-full rounded-xl border border-line bg-canvas px-3.5 text-xs text-fg placeholder-fg-subtle focus:border-brand/60 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-fg px-4 text-xs font-semibold text-canvas hover:opacity-90 disabled:opacity-50"
              >
                {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                <span>{isSubmitting ? 'Salvando...' : 'Salvar nova senha'}</span>
              </button>
            </motion.form>
          </motion.div>
        </main>

        <footer className="relative text-center text-[11px] text-fg-subtle">
          Keep-Alive Monitor · Redefinição de senha
        </footer>

        <ToastContainer toasts={toasts} onDismiss={dismissToast} />
      </div>
    </MotionConfig>
  );
}
