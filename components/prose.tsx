import { Slot, type SlotProps } from '@radix-ui/react-slot';

import { cn } from '@/lib/utils';

type ProseProps = SlotProps & {
  asChild?: boolean;
};

export function Prose({ asChild, className, ...props }: ProseProps) {
  const Comp = asChild ? Slot : 'div';
  return (
    <Comp
      className={cn('prose text-foreground dark:prose-invert', className)}
      {...props}
    />
  );
}
