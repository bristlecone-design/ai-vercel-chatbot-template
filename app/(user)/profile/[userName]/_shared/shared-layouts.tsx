import { cn } from '@/lib/utils';

export function SharedProfileLayoutContainer({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn('px-2 sm:px-[unset]', className)}>{children}</div>;
}
