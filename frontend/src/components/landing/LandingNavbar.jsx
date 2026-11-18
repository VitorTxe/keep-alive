import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useMotionValueEvent, useScroll } from 'framer-motion';
import { Activity, ArrowRight, Github } from 'lucide-react';
import { GITHUB_URL, NAV_LINKS } from './landingContent';
import { EASE_OUT_EXPO } from './motionPresets';

export default function LandingNavbar() {
  const { scrollY } = useScroll();
  const [isScrolled, setIsScrolled] = useState(false);

  useMotionValueEvent(scrollY, 'change', (latest) => {
    setIsScrolled(latest > 24);
  });

  return (
    <motion.header
      initial={{ y: -24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: EASE_OUT_EXPO }}
      className={`fixed inset-x-0 top-0 z-50 border-b transition-colors duration-300 ${
        isScrolled ? 'border-line bg-canvas/75 backdrop-blur-xl' : 'border-transparent bg-transparent'
      }`}
    >
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2 text-sm font-semibold text-fg">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-brand/30 bg-brand/10">
            <Activity className="h-3.5 w-3.5 text-brand" />
          </span>
          Keep-Alive
        </Link>

        <ul className="hidden items-center gap-7 md:flex">
          {NAV_LINKS.map((link) => (
            <li key={link.href}>
              <a href={link.href} className="text-xs font-medium text-fg-muted transition-colors hover:text-fg">
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-2">
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noreferrer"
            aria-label="Repositório no GitHub"
            className="hidden h-8 w-8 items-center justify-center rounded-lg border border-line text-fg-muted transition-colors hover:border-line-strong hover:text-fg sm:flex"
          >
            <Github className="h-4 w-4" />
          </a>
          <Link
            to="/login"
            className="inline-flex h-8 items-center rounded-lg border border-line px-3 text-xs font-medium text-fg-muted transition-colors hover:border-line-strong hover:text-fg"
          >
            Entrar
          </Link>
          <Link
            to="/dashboard"
            className="group inline-flex h-8 items-center gap-1.5 rounded-lg bg-fg px-3 text-xs font-semibold text-canvas transition-opacity hover:opacity-90"
          >
            Abrir Dashboard
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </nav>
    </motion.header>
  );
}
