import type { ReactNode } from "react";
import { DentalJobsDoNotMatchPlacement } from "@/components/DentalJobsDoNotMatchPlacement";
import { DoNotMatchPdfDownload } from "@/components/DoNotMatchPdfDownload";
import { DentalJobsCancelPostingPolish } from "@/components/DentalJobsCancelPostingPolish";
import { DentalJobsDynamicFooter } from "@/components/DentalJobsDynamicFooter";
import { ProfessionalPostingsCardParity } from "@/components/ProfessionalPostingsCardParity";

export default function DentalJobsLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <DentalJobsCancelPostingPolish />
      <DentalJobsDoNotMatchPlacement />
      <DoNotMatchPdfDownload />
      <ProfessionalPostingsCardParity />
      {children}
      <DentalJobsDynamicFooter />
    </>
  );
}
