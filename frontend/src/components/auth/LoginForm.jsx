import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, BellRing, Eye, EyeOff, Loader2, Lock, Mail } from 'lucide-react';
import { fadeUp } from '../landing/motionPresets';

const AUTH_MODES = [
  { id: 'login', label: 'Entrar' },
  { id: 'register', label: 'Criar conta' },
];

export default function LoginForm({ isSubmitting = false, onSubmit }) {
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  async function handleFormSubmit(event) {
    event.preventDefault();
    await onSubmit({ mode, email, password });
  }

  return (
    <motion.form
      variants={fadeUp}
      onSubmit={handleFormSubmit}
      className="space-y-4 rounded-2xl border border-line bg-surface/90 p-6 shadow-2xl shadow-canvas backdrop-blur-xl sm:p-7"
    >
      <div role="tablist" className="grid grid-cols-2 rounded-xl border border-line bg-canvas p-1">
        {AUTH_MODES.map((item) => {
          const active = mode === item.id;
          return (
            <button
              key={item.id}
              role="tab"
              type="button"
              aria-selected={active}
              onClick={() => setMode(item.id)}
              className={`relative rounded-lg py-2 text-xs font-medium transition-colors ${
                active ? 'text-fg' : 'text-fg-subtle hover:text-fg-muted'
              }`}
            >
              {active && (
                <motion.span
                  layoutId="auth-mode-pill"
                  className="absolute inset-0 rounded-lg bg-surface-raised"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
              <span className="relative z-10">{item.label}</span>
            </button>
          );
        })}
      </div>

      <div>
        <label htmlFor="auth-email" className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-fg">
          <Mail className="h-3.5 w-3.5 text-brand" />
          E-mail *
        </label>
        <input
          id="auth-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="voce@exemplo.com"
          autoComplete="email"
          required
          className="h-10 w-full rounded-xl border border-line bg-canvas px-3.5 text-xs text-fg placeholder-fg-subtle transition-colors focus:border-brand/60 focus:outline-none"
        />
      </div>

      <div>
        <label htmlFor="auth-password" className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-fg">
          <Lock className="h-3.5 w-3.5 text-fg-subtle" />
          Senha *
        </label>
        <div className="relative">
          <input
            id="auth-password"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Mínimo de 6 caracteres"
            autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
            minLength={6}
            required
            className="h-10 w-full rounded-xl border border-line bg-canvas pl-3.5 pr-10 text-xs text-fg placeholder-fg-subtle transition-colors focus:border-brand/60 focus:outline-none"
          />
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
            className="absolute inset-y-0 right-0 flex items-center pr-3 text-fg-subtle transition-colors hover:text-fg focus:outline-none"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {mode === 'login' && (
          <div className="mt-1.5 flex justify-end">
            <Link
              to="/forgot-password"
              className="text-[11px] font-medium text-brand transition-opacity hover:opacity-80"
            >
              Esqueci minha senha
            </Link>
          </div>
        )}
      </div>

      <p className="flex items-start gap-2 rounded-xl border border-line bg-canvas/60 px-3 py-2.5 text-[11px] leading-relaxed text-fg-muted">
        <BellRing className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand" />
        <span>
          O e-mail cadastrado será usado para enviar alertas quando seus projetos ficarem offline ou voltarem ao ar.
        </span>
      </p>

      <button
        type="submit"
        disabled={isSubmitting}
        className="group inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-fg px-4 text-xs font-semibold text-canvas transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>{mode === 'register' ? 'Criando conta...' : 'Entrando...'}</span>
          </>
        ) : (
          <>
            <span>{mode === 'register' ? 'Criar conta e acessar' : 'Entrar no Dashboard'}</span>
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </>
        )}
      </button>

      <div className="border-t border-line pt-4 text-center">
        <Link to="/dashboard" className="text-xs font-medium text-fg-muted transition-colors hover:text-fg">
          Entrar apenas para visualização (modo visitante)
        </Link>
      </div>
    </motion.form>
  );
}
