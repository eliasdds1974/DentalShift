import type { ReactNode } from "react";
import { DoNotMatchPanel } from "@/components/DoNotMatchPanel";

export default function DentalJobsLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <DoNotMatchPanel />
      {children}
    </>
  );
}
