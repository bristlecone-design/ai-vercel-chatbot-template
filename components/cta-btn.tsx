import { cn } from '@/lib/utils';
import { Button, type ButtonProps } from '@/components/ui/button';

interface ButtonCtaProps extends ButtonProps {
  showIcon?: boolean;
  size?: ButtonProps['size'];
  variant?: ButtonProps['variant'];
  iconClassName?: string;
  text?: string;
}

export function ButtonCta({
  size = 'lg',
  text = '',
  variant = 'default',
  className,
  showIcon = true,
  disabled,
  children,
  onClick,
  ...props
}: ButtonCtaProps) {
  return (
    <Button
      size={size}
      variant={variant}
      onClick={onClick}
      disabled={disabled}
      className={cn('flex items-center gap-1.5', className)}
      {...props}
    >
      {text || children}
    </Button>
  );
}
