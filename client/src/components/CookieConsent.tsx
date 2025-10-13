import { useState, useEffect } from 'react';
import { Button } from './ui/button';

declare global {
  interface Window {
    dataLayer: any[];
  }
}

function gtag(...args: any[]) {
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push(args);
}

export function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // Check if user has already made a choice
    const consentGiven = localStorage.getItem('cookie-consent');
    
    if (!consentGiven) {
      // Show banner after a short delay for better UX
      const timer = setTimeout(() => setShowBanner(true), 1000);
      return () => clearTimeout(timer);
    } else if (consentGiven === 'accepted') {
      // User previously accepted, update consent
      updateConsent('granted');
    }
  }, []);

  const updateConsent = (value: 'granted' | 'denied') => {
    gtag('consent', 'update', {
      'ad_storage': value,
      'ad_user_data': value,
      'ad_personalization': value,
      'analytics_storage': value
    });
  };

  const handleAccept = () => {
    localStorage.setItem('cookie-consent', 'accepted');
    updateConsent('granted');
    setShowBanner(false);
  };

  const handleDecline = () => {
    localStorage.setItem('cookie-consent', 'declined');
    updateConsent('denied');
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-background/95 backdrop-blur-sm border-t shadow-lg animate-in slide-in-from-bottom">
      <div className="container max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex-1">
            <h3 className="font-semibold text-lg mb-1">Cookie Consent</h3>
            <p className="text-sm text-muted-foreground">
              We use cookies to improve your experience and analyze site usage. 
              By clicking "Accept", you consent to the use of cookies for analytics and personalization.
              {' '}
              <a 
                href="https://policies.google.com/technologies/cookies" 
                target="_blank" 
                rel="noopener noreferrer"
                className="underline hover:text-foreground"
              >
                Learn more
              </a>
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDecline}
              className="whitespace-nowrap"
            >
              Decline
            </Button>
            <Button
              size="sm"
              onClick={handleAccept}
              className="whitespace-nowrap"
            >
              Accept Cookies
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

