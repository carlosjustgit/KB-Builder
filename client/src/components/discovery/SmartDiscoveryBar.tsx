import { useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AnimatedText } from './AnimatedText';

export function SmartDiscoveryBar() {
  const location = useLocation();
  const { t, i18n } = useTranslation('discovery-bar');

  // Detect if we're in standalone mode or embedded in main app
  const isStandalone = useMemo(() => {
    // Check if we're in an iframe or if VITE_IN_APP env var is set
    const inIframe = window.self !== window.top;
    const inAppEnv = import.meta.env.VITE_IN_APP === '1';
    return !inIframe && !inAppEnv;
  }, []);

  // Determine tips based on current route
  const tips = useMemo(() => {
    const path = location.pathname;
    
    // Try to get tips, with fallback to empty array if namespace not loaded
    try {
      if (path.includes('/visual')) {
        return [
          t('tips.remix1'),
          t('tips.remix2'),
          t('tips.value1')
        ];
      } else if (path.includes('/export')) {
        return [
          t('tips.sched1'),
          t('tips.value1'),
          t('tips.ai1')
        ];
      } else {
        return [
          t('tips.ai1'),
          t('tips.remix1'),
          t('tips.value1')
        ];
      }
    } catch (error) {
      console.warn('Discovery bar translations not loaded yet');
      return [];
    }
  }, [location.pathname, t, i18n.language]);

  // Determine CTA based on environment
  const ctaConfig = useMemo(() => {
    if (isStandalone) {
      return {
        text: t('cta.public', { defaultValue: 'Explore Witfy.social →' }),
        href: 'https://witfy.social',
        target: '_blank',
        rel: 'noopener noreferrer'
      };
    } else {
      // In-app mode - try to navigate to /remix or /dashboard
      return {
        text: t('cta.inApp', { defaultValue: 'Open in Witfy →' }),
        href: '/remix', // Could be /dashboard if /remix doesn't exist
        target: undefined,
        rel: undefined
      };
    }
  }, [isStandalone, t]);

  return (
    <footer className="border-t border-border bg-muted/30 h-16 flex items-center px-6">
      <div className="flex items-center justify-between w-full max-w-screen-2xl mx-auto">
        {/* Left: Witfy Icon */}
        <div className="flex items-center">
          <img 
            src="/logo-Witfy-icon-main.png" 
            alt="Witfy" 
            className="h-8 w-8 object-contain"
          />
        </div>

        {/* Center: Animated Tips */}
        <div className="flex-1 px-8">
          <AnimatedText items={tips} intervalMs={7000} />
        </div>

        {/* Right: CTA */}
        <div className="flex items-center">
          <a
            href={ctaConfig.href}
            target={ctaConfig.target}
            rel={ctaConfig.rel}
            className="text-sm font-medium text-primary hover:text-primary/80 transition-colors underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded px-2 py-1"
          >
            {ctaConfig.text}
          </a>
        </div>
      </div>
    </footer>
  );
}

