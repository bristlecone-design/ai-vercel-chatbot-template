import {
  type RefObject,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';

export function useScrollToBottom<T extends HTMLElement>(props?: {
  isGeneratingContent?: boolean;
}): {
  containerRef: RefObject<T | null>;
  endRef: RefObject<T | null>;
  isAtBottom: boolean;
  isVisible: boolean;
  scrollToBottom: () => void;
} {
  const { isGeneratingContent = false } = props || {};

  const containerRef = useRef<T>(null);
  const endRef = useRef<T>(null);

  const [isAtBottom, setIsAtBottom] = useState(true);
  const [isVisible, setIsVisible] = useState(false);

  // Handle scrolling to the bottom of the container
  const scrollToBottom = useCallback(() => {
    if (containerRef.current) {
      containerRef.current.scrollIntoView({
        block: 'end',
        behavior: 'smooth',
      });
    } else if (endRef.current) {
      endRef.current.scrollIntoView({
        block: 'end',
        behavior: 'smooth',
      });
    }
  }, []);

  // Auto-scroll to the bottom of the container when new content is added
  useEffect(() => {
    if (isGeneratingContent) {
      const container = containerRef.current;
      const end = endRef.current;
      if (container && end) {
        const observer = new MutationObserver(() => {
          end.scrollIntoView({ behavior: 'smooth', block: 'end' });
        });
        observer.observe(container, {
          childList: true,
          subtree: true,
          attributes: true,
          characterData: true,
        });
        return () => observer.disconnect();
      }
    }
  }, [isGeneratingContent]);

  // Track if the user has scrolled to the bottom of the container
  useEffect(() => {
    if (endRef.current) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              setIsVisible(true);
            } else {
              setIsVisible(false);
            }
          });
        },
        {
          rootMargin: '0px 0px -150px 0px',
        },
      );

      observer.observe(endRef.current);

      return () => {
        observer.disconnect();
      };
    }
  });

  // Track if the user has scrolled to the bottom of the container
  useEffect(() => {
    const { current } = containerRef;
    if (current) {
      const handleScroll = (event: Event) => {
        const target = event.target as HTMLElement;
        const offset = 25;
        const isAtBottom =
          target.scrollTop + target.clientHeight >=
          target.scrollHeight - offset;

        setIsAtBottom(isAtBottom);
      };

      current.addEventListener('scroll', handleScroll, {
        passive: true,
      });

      return () => {
        containerRef.current?.removeEventListener('scroll', handleScroll);
      };
    }
  }, []);

  return { containerRef, endRef, isAtBottom, isVisible, scrollToBottom };
}
