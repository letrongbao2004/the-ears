import { useEffect, useRef, useCallback } from 'react';

export const useAutoScroll = (dependency: any[], delay: number = 100) => {
  const endRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback((smooth: boolean = true) => {
    // Method 1: Using end reference
    if (endRef.current) {
      endRef.current.scrollIntoView({ 
        behavior: smooth ? "smooth" : "auto",
        block: "end"
      });
      return;
    }

    // Method 2: Using container reference
    if (containerRef.current) {
      const scrollContainer = containerRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        if (smooth) {
          scrollContainer.scrollTo({
            top: scrollContainer.scrollHeight,
            behavior: 'smooth'
          });
        } else {
          scrollContainer.scrollTop = scrollContainer.scrollHeight;
        }
      }
    }
  }, []);

  // Auto scroll when dependency changes
  useEffect(() => {
    if (dependency.length > 0) {
      const timer = setTimeout(() => scrollToBottom(), delay);
      return () => clearTimeout(timer);
    }
  }, dependency);

  // Scroll to bottom immediately (for manual calls)
  const scrollToBottomNow = useCallback(() => {
    scrollToBottom(false);
  }, [scrollToBottom]);

  return {
    endRef,
    containerRef,
    scrollToBottom,
    scrollToBottomNow
  };
};