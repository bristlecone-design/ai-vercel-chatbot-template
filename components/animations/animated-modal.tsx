'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { clsx } from 'clsx';
import { motion } from 'framer-motion';

import useClickInsideOutside from '@/hooks/use-click-inside-outside';
import useMetaThemeColor from '@/hooks/use-meta-theme-color';
import usePrefersReducedMotion from '@/hooks/use-prefers-reduced-motion';
import AnimateItems from '@/components/animations/animated-items';

import { PATH_ROOT } from '@/config/site-paths';

export default function AnimatedModal({
  onClosePath,
  onClose,
  className,
  anchor = 'center',
  children,
  fast,
}: {
  onClosePath?: string;
  onClose?: () => void;
  className?: string;
  anchor?: 'top' | 'center';
  children: ReactNode;
  fast?: boolean;
}) {
  const router = useRouter();

  const prefersReducedMotion = usePrefersReducedMotion();

  const contentRef = useRef<HTMLDivElement>(null);

  const [htmlElements, setHtmlElements] = useState<HTMLDivElement[]>([]);

  useEffect(() => {
    if (contentRef.current) {
      setHtmlElements([contentRef.current]);
    }
  }, []);

  useMetaThemeColor({ colorLight: '#333' });

  useClickInsideOutside({
    htmlElements,
    onClickOutside: () => {
      if (onClose) {
        onClose();
      } else {
        router.push(onClosePath ?? PATH_ROOT, { scroll: false });
      }
    },
  });

  return (
    <motion.div
      className={clsx(
        'fixed inset-0 z-50 flex justify-center',
        anchor === 'top' ? 'items-start pt-4 sm:pt-24' : 'items-center',
        'bg-black'
      )}
      initial={
        !prefersReducedMotion ? { backgroundColor: 'rgba(0, 0, 0, 0)' } : false
      }
      animate={{ backgroundColor: 'rgba(0, 0, 0, 0.80)' }}
      transition={{ duration: 0.3, easing: 'easeOut' }}
    >
      <AnimateItems
        duration={fast ? 0.1 : 0.3}
        items={[
          <div
            ref={contentRef}
            key="modalContent"
            className={clsx(
              'w-[calc(100vw-1.5rem)] sm:w-[min(540px,90vw)]',
              'rounded-lg p-3',
              'md:rounded-xl md:p-4',
              'bg-white dark:bg-black',
              'dark:border dark:border-gray-800',
              className
            )}
          >
            {children}
          </div>,
        ]}
      />
    </motion.div>
  );
}
