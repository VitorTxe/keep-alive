import { MotionConfig } from 'framer-motion';
import ToastContainer from '../components/Toast';
import CtaSection from '../components/landing/CtaSection';
import FeaturesBento from '../components/landing/FeaturesBento';
import HeroSection from '../components/landing/HeroSection';
import HowItWorksSection from '../components/landing/HowItWorksSection';
import LandingFooter from '../components/landing/LandingFooter';
import LandingNavbar from '../components/landing/LandingNavbar';
import ProvidersMarquee from '../components/landing/ProvidersMarquee';
import UptimeSection from '../components/landing/UptimeSection';
import { useSmoothScroll } from '../hooks/useSmoothScroll';
import { useToast } from '../hooks/useToast';

export default function LandingPage() {
  useSmoothScroll();
  const { toasts, showToast, dismissToast } = useToast();

  return (
    // reducedMotion="user" respeita a preferência de acessibilidade do sistema operacional
    <MotionConfig reducedMotion="user">
      <div className="min-h-screen overflow-x-clip bg-canvas text-fg selection:bg-brand/20">
        <LandingNavbar />
        <main>
          <HeroSection />
          <ProvidersMarquee />
          <FeaturesBento />
          <HowItWorksSection showToast={showToast} />
          <UptimeSection />
          <CtaSection />
        </main>
        <LandingFooter />
        <ToastContainer toasts={toasts} onDismiss={dismissToast} />
      </div>
    </MotionConfig>
  );
}
