import type { ReactNode } from "react";
import { DentalJobsDoNotMatchPlacement } from "@/components/DentalJobsDoNotMatchPlacement";
import { DentalJobsRoleSync } from "@/components/DentalJobsRoleSync";
import { DentalJobsHeadingSync } from "@/components/DentalJobsHeadingSync";
import { DentalJobsCancelPostingPolish } from "@/components/DentalJobsCancelPostingPolish";

export default function DentalJobsLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <DentalJobsRoleSync />
      <DentalJobsHeadingSync />
      <DentalJobsCancelPostingPolish />
      <DentalJobsDoNotMatchPlacement />
      {children}
    </>
  );
}
