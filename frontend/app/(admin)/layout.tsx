import { AdminLayoutGate } from "@/components/layout/AdminLayoutGate";
import type { ReactNode } from "react";

export default function AdminLayout({ children }: Readonly<{ children: ReactNode }>) {
  return <AdminLayoutGate>{children}</AdminLayoutGate>;
}
