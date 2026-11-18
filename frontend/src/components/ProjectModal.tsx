import { type FormEvent, useEffect, useState } from 'react';
import { Eye, EyeOff, Loader2, Shield, X } from 'lucide-react';
import type { Project, ProjectFormPayload } from '../types';

const PROVIDER_SUGGESTIONS = [
  'Render + Postgres',
  'Render + MongoDB',
  'Vercel + Supabase',
  'Cloudflare + D1',
] as const;

function isValidHttpUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

export interface ProjectModalProps {
  isOpen: boolean;
  initialData: Project | null;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (data: ProjectFormPayload) => void | Promise<void>;
}

export default function ProjectModal({
  isOpen,
  initialData,
  isSubmitting,
  onClose,
  onSubmit,
}: ProjectModalProps) {
  const [name, setName] = useState('');
  const [pingUrl, setPingUrl] = useState('');
  const [providerInfo, setProviderInfo] = useState('');
  const [secretHeader, setSecretHeader] = useState('');
  const [showSecret, setShowSecret] = useState(false);
  const [validationError, setValidationError] = useState('');

  const isEditing = Boolean(initialData?.id);

  useEffect(() => {
    if (isOpen) {
      setName(initialData?.name || '');
      setPingUrl(initialData?.pingUrl || '');
      setProviderInfo(initialData?.providerInfo || '');
      setSecretHeader(initialData?.secretHeader || '');
      setShowSecret(false);
      setValidationError('');
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();

    if (!name.trim()) {
      setValidationError('Informe o nome do projeto.');
      return;
    }

    if (!pingUrl.trim() || !isValidHttpUrl(pingUrl.trim())) {
      setValidationError('Informe uma URL HTTP/HTTPS válida para o endpoint de keep-alive.');
      return;
    }

    if (!providerInfo.trim()) {
      setValidationError('Informe a infraestrutura / provedor do projeto.');
      return;
    }

    setValidationError('');
    void onSubmit({
      name: name.trim(),
      pingUrl: pingUrl.trim(),
      providerInfo: providerInfo.trim(),
      secretHeader: secretHeader.trim() || null,
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/80 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-xl border border-zinc-800 bg-zinc-900 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-4">
          <div>
            <h2 className="text-base font-semibold text-zinc-100">
              {isEditing ? 'Editar Projeto' : 'Novo Projeto Monitorado'}
            </h2>
            <p className="text-xs text-zinc-400">
              Configure a rota de health-check para manter o servidor e o banco aquecidos.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-5">
          {validationError && (
            <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-300">
              {validationError}
            </div>
          )}

          <div>
            <label htmlFor="project-name" className="mb-1.5 block text-xs font-medium text-zinc-300">
              Nome do Projeto *
            </label>
            <input
              id="project-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="ex: DevChef API"
              className="h-9 w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 text-sm text-zinc-100 placeholder-zinc-600 focus:border-zinc-600 focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="project-url" className="mb-1.5 block text-xs font-medium text-zinc-300">
              URL da Rota de Ping *
            </label>
            <input
              id="project-url"
              type="url"
              value={pingUrl}
              onChange={(e) => setPingUrl(e.target.value)}
              placeholder="https://meu-app.onrender.com/api/keep-alive"
              className="h-9 w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 font-mono text-xs text-zinc-100 placeholder-zinc-600 focus:border-zinc-600 focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="project-provider" className="mb-1.5 block text-xs font-medium text-zinc-300">
              Infraestrutura / Provedor *
            </label>
            <input
              id="project-provider"
              type="text"
              value={providerInfo}
              onChange={(e) => setProviderInfo(e.target.value)}
              placeholder="ex: Render + MongoDB Atlas"
              className="h-9 w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 text-sm text-zinc-100 placeholder-zinc-600 focus:border-zinc-600 focus:outline-none"
            />
            <div className="mt-2 flex flex-wrap gap-1.5">
              {PROVIDER_SUGGESTIONS.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => setProviderInfo(suggestion)}
                  className={`rounded-md border px-2 py-1 text-[11px] transition-colors ${
                    providerInfo === suggestion
                      ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
                      : 'border-zinc-800 bg-zinc-950/70 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                  }`}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="project-secret" className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-zinc-300">
              <Shield className="h-3.5 w-3.5 text-zinc-500" />
              Header de Segurança Opcional (x-ping-secret)
            </label>
            <div className="relative">
              <input
                id="project-secret"
                type={showSecret ? 'text' : 'password'}
                value={secretHeader}
                onChange={(e) => setSecretHeader(e.target.value)}
                placeholder="Opcional — enviado no header x-ping-secret"
                className="h-9 w-full rounded-lg border border-zinc-800 bg-zinc-950 pl-3 pr-9 font-mono text-xs text-zinc-100 placeholder-zinc-600 focus:border-zinc-600 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowSecret((prev) => !prev)}
                aria-label={showSecret ? 'Ocultar segredo' : 'Mostrar segredo'}
                title={showSecret ? 'Ocultar segredo' : 'Mostrar segredo'}
                className="absolute inset-y-0 right-0 flex items-center pr-2.5 text-zinc-500 transition-colors hover:text-zinc-200 focus:outline-none"
              >
                {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-zinc-800 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="h-9 rounded-lg border border-zinc-800 bg-zinc-950 px-4 text-xs font-medium text-zinc-300 transition-colors hover:bg-zinc-800 disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-zinc-100 px-4 text-xs font-semibold text-zinc-950 transition-colors hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              <span>{isEditing ? 'Salvar Alterações' : 'Cadastrar Projeto'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
