import type { ReactNode } from "react";
import { DentalJobsDoNotMatchPlacement } from "@/components/DentalJobsDoNotMatchPlacement";
import { DoNotMatchPdfDownload } from "@/components/DoNotMatchPdfDownload";
import { DentalJobsRoleSync } from "@/components/DentalJobsRoleSync";
import { DentalJobsHeadingSync } from "@/components/DentalJobsHeadingSync";
import { DentalJobsCancelPostingPolish } from "@/components/DentalJobsCancelPostingPolish";
import { DentalJobsDistanceSync } from "@/components/DentalJobsDistanceSync";
import { DentalJobsDynamicFooter } from "@/components/DentalJobsDynamicFooter";

export default function DentalJobsLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <DentalJobsRoleSync />
      <DentalJobsHeadingSync />
      <DentalJobsCancelPostingPolish />
      <DentalJobsDistanceSync />
      <DentalJobsDoNotMatchPlacement />
      <DoNotMatchPdfDownload />
      {children}
      <DentalJobsDynamicFooter />
    </>
  );
}
