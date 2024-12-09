'use client';

import React from 'react';
import { useIntersection } from 'react-use';

import { scrollToTop } from '@/lib/dom';
import { cn } from '@/lib/utils';
import { Button, type ButtonProps } from '@/components/ui/button';
import { IconArrowUp } from '@/components/ui/icons';

interface ButtonScrollToTopProps extends ButtonProps {
  label?: string;
  topOffset?: number;
  scrollToTop?: () => void;
}

export function ButtonScrollToTop({
  className,
  label = 'Back to top',
  topOffset = 72,
  scrollToTop: scrollToTopProp = scrollToTop,
  ...props
}: ButtonScrollToTopProps) {
  const btnRef = React.useRef<HTMLButtonElement>(null);
  const intersection = useIntersection(btnRef, {
    root: null,
    rootMargin: '0px',
    threshold: 1,
  });

  // Detect window y position to show the button
  React.useEffect(() => {
    const handleScroll = () => {
      const { current } = btnRef;
      if (current) {
        current.style.opacity = window.scrollY > topOffset ? '1' : '0';
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <Button
      ref={btnRef}
      variant="outline"
      size="sm"
      className={cn(
        'gap-1.5 bg-background brightness-25 transition-opacity duration-300',
        intersection?.isIntersecting
          ? 'opacity-100 hover:brightness-100'
          : 'opacity-0',
        className
      )}
      onClick={() => scrollToTop()}
      {...props}
    >
      <IconArrowUp />
      {label}
      <span className="sr-only">Scroll to top</span>
    </Button>
  );
}
