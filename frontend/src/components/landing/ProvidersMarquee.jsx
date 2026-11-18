import { PROVIDERS } from './landingContent';

/** Faixa infinita de provedores suportados indo da direita para a esquerda. */
export default function ProvidersMarquee() {
  const items = [...PROVIDERS, ...PROVIDERS, ...PROVIDERS, ...PROVIDERS];

  return (
    <section aria-label="Provedores compatíveis" className="border-y border-line bg-surface/40 py-8">
      <p className="mb-6 text-center font-mono text-[11px] uppercase tracking-[0.2em] text-fg-subtle">
        Compatível com qualquer stack que responda HTTP
      </p>
      <div className="mask-fade-x overflow-hidden">
        <ul className="flex w-max animate-marquee">
          {items.map((provider, index) => (
            <li
              key={`${provider}-${index}`}
              aria-hidden={index >= PROVIDERS.length}
              className="whitespace-nowrap pr-12 text-lg font-semibold tracking-tight text-fg-subtle/80"
            >
              {provider}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
