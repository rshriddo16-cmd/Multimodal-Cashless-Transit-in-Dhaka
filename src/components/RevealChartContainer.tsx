import { useEffect, useRef, useState, type ReactNode } from 'react';

export function useInViewReveal<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const [isVisible, setIsVisible] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return true;
    return !('IntersectionObserver' in window);
  });

  useEffect(() => {
    const el = ref.current;
    if (!el || isVisible) return;

    if (
      typeof window === 'undefined' ||
      !('IntersectionObserver' in window) ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      setIsVisible(true);
      return;
    }

    const revealIfInOrAboveViewport = () => {
      const rect = el.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0 && rect.top <= window.innerHeight * 0.96) {
        setIsVisible(true);
        return true;
      }
      return false;
    };

    const rafId = window.requestAnimationFrame(() => {
      revealIfInOrAboveViewport();
    });

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const rect = entry.boundingClientRect;
          const isRendered = rect.width > 0 && rect.height > 0;
          if (entry.isIntersecting || (isRendered && rect.top <= window.innerHeight * 0.96)) {
            setIsVisible(true);
            observer.disconnect();
            break;
          }
        }
      },
      { threshold: 0.08, rootMargin: '0px 0px -24px 0px' }
    );

    observer.observe(el);

    return () => {
      window.cancelAnimationFrame(rafId);
      observer.disconnect();
    };
  }, [isVisible]);

  return { ref, isVisible };
}

interface RevealChartContainerProps {
  children: ReactNode;
  className?: string;
  delayMs?: number;
}

export function RevealChartContainer({
  children,
  className = '',
  delayMs = 0,
}: RevealChartContainerProps) {
  const { ref, isVisible } = useInViewReveal<HTMLDivElement>();

  return (
    <div
      ref={ref}
      style={delayMs > 0 && isVisible ? { transitionDelay: `${delayMs}ms` } : undefined}
      className={`transition-[opacity,transform] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none motion-reduce:opacity-100 motion-reduce:translate-y-0 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      } ${className}`}
    >
      {children}
    </div>
  );
}
