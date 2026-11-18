import { Link } from 'react-router-dom';
import { Activity } from 'lucide-react';
import { GITHUB_URL, NAV_LINKS } from './landingContent';

export default function LandingFooter() {
  return (
    <footer className="border-t border-line">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="flex items-center gap-2 text-sm font-semibold text-fg">
          <Activity className="h-4 w-4 text-brand" />
          Keep-Alive Monitor
          <span className="font-normal text-fg-subtle">· {new Date().getFullYear()}</span>
        </div>

        <nav className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-fg-muted">
          {NAV_LINKS.map((link) => (
            <a key={link.href} href={link.href} className="transition-colors hover:text-fg">
              {link.label}
            </a>
          ))}
          <Link to="/dashboard" className="transition-colors hover:text-fg">
            Dashboard
          </Link>
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noreferrer"
            className="transition-colors hover:text-fg"
          >
            GitHub
          </a>
        </nav>
      </div>
    </footer>
  );
}
