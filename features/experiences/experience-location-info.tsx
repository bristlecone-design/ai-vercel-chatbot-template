import { cn } from '@/lib/utils';
import { IconMapPin } from '@/components/ui/icons';

export type ExperienceLocationInfoProps = {
  userLocation: string;
  isPreciseLocation?: boolean;
  approxClassName?: string;
  locationClassName?: string;
  className?: string;
};

export function ExperienceLocationInfo({
  className,
  locationClassName,
  approxClassName,
  userLocation,
  isPreciseLocation,
}: ExperienceLocationInfoProps) {
  if (!userLocation) {
    return null;
  }

  return (
    <div
      className={cn(
        'flex items-center justify-start gap-1 text-sm text-foreground/40',
        className
      )}
    >
      <IconMapPin className="size-4" />
      <span className="inline-block max-w-16 truncate sm:max-w-48">
        <span className={cn(locationClassName)}>
          {userLocation}{' '}
          {!isPreciseLocation && (
            <span className={cn('font-light brightness-50', approxClassName)}>
              (approx)
            </span>
          )}
        </span>
      </span>
    </div>
  );
}
