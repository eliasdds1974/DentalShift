import type { ReactNode } from "react";
import { DoNotMatchPanel } from "@/components/DoNotMatchPanel";
import { DentalJobsRoleSync } from "@/components/DentalJobsRoleSync";
import { DentalJobsHeadingSync } from "@/components/DentalJobsHeadingSync";

export default function DentalJobsLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <DentalJobsRoleSync />
      <DentalJobsHeadingSync />
      <DoNotMatchPanel />
      {children}
    </>
  );
}
