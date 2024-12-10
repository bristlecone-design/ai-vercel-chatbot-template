import { toast } from 'sonner';

export function SingleExperienceEngagementToast(
  icon: React.ReactNode,
  title: string,
  content?: string
) {
  return toast(
    <div className="flex w-full max-w-full gap-2">
      <span className="flex items-start gap-1.5">{icon}</span>
      <span className="flex flex-col items-start gap-1.5 leading-none">
        <span className="shrink leading-normal">{title}</span>
        {content && (
          <span className="truncate brightness-50">
            {content.length > 42 ? `${content.slice(0, 42)}...` : content}
          </span>
        )}
      </span>
    </div>
  );
}
