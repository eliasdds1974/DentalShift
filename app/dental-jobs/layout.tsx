import type { ReactNode } from "react";
import { DoNotMatchPanel } from "@/components/DoNotMatchPanel";
import { DentalJobsRoleSync } from "@/components/DentalJobsRoleSync";

export default function DentalJobsLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <DentalJobsRoleSync />
      <DoNotMatchPanel />
      {children}
    </>
  );
}
