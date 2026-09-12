import { createClient } from "@supabase/supabase-js";

export type PublicJobListing = {
  id: string;
  listing_type: "office_hiring" | "professional_available";
  profession: string;
  employment_type: string;
  city: string;
  province: string;
  days_per_week: string | null;
  pay_min: number | null;
  pay_max: number | null;
  schedule: string | null;
  description: string;
  status: string;
  expires_at: string;
  created_at: string;
};

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://pvugjtlmtlyfzyvvhcik.supabase.co";
const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  "sb_publishable_cl7HUUywEucu1DsSbuaodA_oKo8qNFJ";

function client() {
  return createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

export function citySlug(city: string) {
  return city
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function professionSlug(profession: string) {
  return citySlug(profession);
}

export async function getActivePublicJobs(): Promise<PublicJobListing[]> {
  const { data, error } = await client()
    .from("job_listings")
    .select("id,listing_type,profession,employment_type,city,province,days_per_week,pay_min,pay_max,schedule,description,status,expires_at,created_at")
    .eq("status", "active")
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return data as PublicJobListing[];
}

export async function getActivePublicJob(id: string): Promise<PublicJobListing | null> {
  const { data } = await client()
    .from("job_listings")
    .select("id,listing_type,profession,employment_type,city,province,days_per_week,pay_min,pay_max,schedule,description,status,expires_at,created_at")
    .eq("id", id)
    .eq("status", "active")
    .gt("expires_at", new Date().toISOString())
    .maybeSingle();
  return (data as PublicJobListing | null) ?? null;
}

export async function getJobsForCity(slug: string): Promise<{ city: string; province: string; listings: PublicJobListing[] } | null> {
  const jobs = await getActivePublicJobs();
  const listings = jobs.filter((job) => citySlug(job.city) === slug);
  if (!listings.length) return null;
  return { city: listings[0].city, province: listings[0].province, listings };
}

export function payLabel(listing: PublicJobListing) {
  const min = listing.pay_min == null ? null : Number(listing.pay_min);
  const max = listing.pay_max == null ? null : Number(listing.pay_max);
  if (min == null && max == null) return "Compensation discussed privately";
  if (min != null && max != null) return `$${min}–$${max}/hr`;
  if (min != null) return `$${min}+/hr`;
  return `Up to $${max}/hr`;
}
