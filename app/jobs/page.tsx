import type { Metadata } from "next";
import { PublicDentalJobs } from "@/components/PublicDentalJobs";
import { getActivePublicJobs } from "@/lib/public-dentaljobs";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Dental Jobs in Canada | DentalJobs by DentalShift",
  description: "Browse dental jobs and dental professionals looking for offices across Canada. Public listings from DentalJobs by DentalShift.",
  alternates: { canonical: "https://www.dentalshift.ca/jobs" },
  openGraph: {
    title: "DentalJobs by DentalShift",
    description: "Browse dental jobs and available dental professionals across Canada.",
    url: "https://www.dentalshift.ca/jobs",
    siteName: "DentalShift",
    type: "website",
  },
};

export default async function DentalJobsPublicHome() {
  const listings = await getActivePublicJobs();
  return <PublicDentalJobs listings={listings} />;
}
