import { PublicShell } from "@/components/layout/PublicShell";
import type { ReactNode } from "react";

export default function PublicLayout({ children }: Readonly<{ children: ReactNode }>) {
  return <PublicShell>{children}</PublicShell>;
}
