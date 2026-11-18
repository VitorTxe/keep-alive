import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, Copy } from 'lucide-react';
import { useCopyToClipboard } from '../../hooks/useCopyToClipboard';
import { CODE_SNIPPETS } from './codeSnippets';

/** Bloco de código com abas animadas (indicador compartilhado via layoutId). */
export default function CodeTabs({ showToast }) {
  const [activeId, setActiveId] = useState(CODE_SNIPPETS[0].id);
  const { isCopied, copy } = useCopyToClipboard(showToast);
  const activeSnippet = CODE_SNIPPETS.find((snippet) => snippet.id === activeId) ?? CODE_SNIPPETS[0];

  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-surface">
      <div className="flex items-center justify-between gap-2 border-b border-line px-2">
        <div role="tablist" className="flex flex-wrap items-center">
          {CODE_SNIPPETS.map((snippet) => {
            const isActive = snippet.id === activeId;
            return (
              <button
                key={snippet.id}
                role="tab"
                type="button"
                aria-selected={isActive}
                onClick={() => setActiveId(snippet.id)}
                className={`relative whitespace-nowrap px-3 py-3 text-xs font-medium transition-colors ${
                  isActive ? 'text-fg' : 'text-fg-subtle hover:text-fg-muted'
                }`}
              >
                {snippet.label}
                {isActive && (
                  <motion.span
                    layoutId="code-tab-indicator"
                    className="absolute inset-x-2 bottom-0 h-px bg-brand"
                    transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                  />
                )}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => copy(activeSnippet.code)}
          aria-label="Copiar código"
          className="mr-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-fg-subtle transition-colors hover:bg-surface-raised hover:text-fg"
        >
          {isCopied ? <Check className="h-3.5 w-3.5 text-brand" /> : <Copy className="h-3.5 w-3.5" />}
        </button>
      </div>

      <AnimatePresence mode="wait">
        <motion.pre
          key={activeSnippet.id}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.2 }}
          className="overflow-x-auto p-5 font-mono text-[12px] leading-relaxed text-fg-muted"
        >
          <code>{activeSnippet.code}</code>
        </motion.pre>
      </AnimatePresence>
    </div>
  );
}
