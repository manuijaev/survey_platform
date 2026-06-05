"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

const seenKeys = new Set<string>();

export function TypewriterText({
  text,
  questionKey,
  className,
  onComplete,
  instant = false
}: {
  text: string;
  questionKey: string;
  className?: string;
  onComplete?: () => void;
  instant?: boolean;
}) {
  const shouldAnimate = !instant && !seenKeys.has(questionKey);
  const [displayed, setDisplayed] = useState(shouldAnimate ? "" : text);
  const [showCursor, setShowCursor] = useState(shouldAnimate);
  const completedRef = useRef(false);
  const completionTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (!shouldAnimate) {
      seenKeys.add(questionKey);
      onComplete?.();
      return;
    }

    setDisplayed("");
    setShowCursor(true);
    completedRef.current = false;

    let index = 0;
    const interval = window.setInterval(() => {
      index += 1;
      setDisplayed(text.slice(0, index));

      if (index >= text.length) {
        window.clearInterval(interval);
        seenKeys.add(questionKey);
        completionTimeoutRef.current = window.setTimeout(() => {
          if (!completedRef.current) {
            completedRef.current = true;
            setShowCursor(false);
            onComplete?.();
          }
        }, 600);
      }
    }, 28);

    return () => {
      window.clearInterval(interval);
      if (completionTimeoutRef.current !== null) {
        window.clearTimeout(completionTimeoutRef.current);
      }
    };
  }, [onComplete, questionKey, shouldAnimate, text]);

  return (
    <span className={cn("text-balance", className)}>
      {displayed}
      {showCursor ? <span className="cursor-blink ml-1 text-[color:var(--primary)]">|</span> : null}
    </span>
  );
}
