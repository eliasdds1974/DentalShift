import type { MetadataRoute } from "next";
import { citySlug, getActivePublicJobs } from "@/lib/public-dentaljobs";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.dentalshift.ca";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const jobs = await getActivePublicJobs();
  const now = new Date();
  const cities = [...new Set(jobs.map((job) => citySlug(job.city)))];

  return [
    { url: siteUrl, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${siteUrl}/jobs`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    ...cities.map((city) => ({ url: `${siteUrl}/jobs/${city}`, lastModified: now, changeFrequency: "daily" as const, priority: 0.8 })),
    ...jobs.map((job) => ({ url: `${siteUrl}/jobs/${job.id}`, lastModified: new Date(job.created_at), changeFrequency: "weekly" as const, priority: 0.7 })),
  ];
}
