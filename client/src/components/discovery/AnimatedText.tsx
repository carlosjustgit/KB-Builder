import { useState, useEffect } from 'react';

interface AnimatedTextProps {
  items: string[];
  intervalMs?: number;
}

export function AnimatedText({ items, intervalMs = 7000 }: AnimatedTextProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (items.length <= 1 || isPaused) return;

    const fadeOutDuration = 200;
    const fadeInDelay = 100;

    const interval = setInterval(() => {
      // Fade out
      setIsVisible(false);

      // Wait for fade out, then change text and fade in
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % items.length);
        setIsVisible(true);
      }, fadeOutDuration + fadeInDelay);
    }, intervalMs);

    return () => clearInterval(interval);
  }, [items, intervalMs, isPaused]);

  if (!items || items.length === 0) {
    return null;
  }

  return (
    <div
      className="relative flex items-center justify-center min-h-[24px]"
      aria-live="polite"
      aria-label="Tips about Witfy features"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <p
        className={`text-sm text-muted-foreground text-center transition-opacity duration-200 ${
          isVisible ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {items[currentIndex]}
      </p>
    </div>
  );
}

