import type { ReactNode } from "react";
import { DoNotMatchPanel } from "@/components/DoNotMatchPanel";
import { DentalJobsRoleSync } from "@/components/DentalJobsRoleSync";
import { DentalJobsHeadingSync } from "@/components/DentalJobsHeadingSync";
import { DentalJobsCancelPostingPolish } from "@/components/DentalJobsCancelPostingPolish";

export default function DentalJobsLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <DentalJobsRoleSync />
      <DentalJobsHeadingSync />
      <DentalJobsCancelPostingPolish />
      <DoNotMatchPanel />
      {children}
    </>
  );
}
