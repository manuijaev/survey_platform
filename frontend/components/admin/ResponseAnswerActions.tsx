"use client";

import { ExternalLink, Mail } from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { AnswerAction } from "@/lib/responseAnswerActions";

type ResponseAnswerActionsProps = {
  actions: AnswerAction[];
  size?: "sm" | "md";
  className?: string;
  onActionClick?: (event: React.MouseEvent) => void;
};

export function ResponseAnswerActions({
  actions,
  size = "sm",
  className,
  onActionClick
}: ResponseAnswerActionsProps) {
  if (actions.length === 0) return null;

  return (
    <div className={className ?? "flex flex-wrap gap-2"}>
      {actions.map((action) => (
        <Button
          key={`${action.kind}-${action.key}-${action.href}`}
          variant="outline"
          size={size}
          title={action.value}
          leftIcon={
            action.kind === "email" ? (
              <Mail className="h-3.5 w-3.5" />
            ) : (
              <ExternalLink className="h-3.5 w-3.5" />
            )
          }
          onClick={(event) => {
            onActionClick?.(event);
            if (action.kind === "email") {
              window.location.href = action.href;
              return;
            }
            window.open(action.href, "_blank", "noopener,noreferrer");
          }}
        >
          {action.label}
        </Button>
      ))}
    </div>
  );
}
