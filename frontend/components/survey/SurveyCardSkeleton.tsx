import { Skeleton } from "@/components/ui/Skeleton";
import { cn } from "@/lib/utils";
import styles from "./SurveyCard.module.css";

export function SurveyCardSkeleton() {
  return (
    <div className={styles.card} aria-hidden>
      <div className={styles.header}>
        <Skeleton className={cn(styles.titleGlass, "h-[3.25rem] w-full")} />
        <Skeleton className="h-9 w-9 shrink-0 rounded-full" />
      </div>
      <div className="mt-3 space-y-2">
        <Skeleton className="h-4 w-full rounded-lg" />
        <Skeleton className="h-4 w-full rounded-lg" />
        <Skeleton className="h-4 w-5/6 rounded-lg" />
      </div>
      <div className={styles.meta}>
        <Skeleton className="h-6 w-16 rounded-full" />
        <Skeleton className="h-6 w-24 rounded-full" />
      </div>
      <div className={styles.footer}>
        <Skeleton className="h-4 w-16 rounded-lg" />
        <Skeleton className="h-8 w-24 rounded-xl" />
      </div>
    </div>
  );
}
