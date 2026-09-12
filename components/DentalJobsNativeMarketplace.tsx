"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { BriefcaseBusiness, Building2, Clock3, Eye, MapPin, UserRound, X } from "lucide-react";
import { ShareListingButton } from "@/components/ShareListingButton";
import { loadAccountDetails } from "@/lib/dentalshift";
import { supabase } from "@/lib/supabase";

type Role = "office" | "professional";

type Listing = {
  id: string;
  listing_type: "office_hiring" | "professional_available";
  profession: string;
  office_id: string | null;
  professional_id: string | null;
  employment_type: string;
  city: string;
  province: string;
  days_per_week: string | null;
  pay_min: number | null;
  pay_max: number | null;
  schedule: string | null;
  description: string;
  created_at: string;
  distance: number | null;
};

type ApplicationState = {
  id: string;
  listing_id: string;
  status: string;
};

type DistanceRow = {
  listing_id: string;
  distance_km: number | null;
};

const provinceNames: Record<string, string> = {
  AB: "Alberta",
  BC: "British Columbia",
  MB: "Manitoba",
  NB: "New Brunswick",
  NL: "Newfoundland & Labrador",
  NS: "Nova Scotia",
  NT: "Northwest Territories",
  NU: "Nunavut",
  ON: "Ontario",
  PE: "Prince Edward Island",
  QC: "Quebec",
  SK: "Saskatchewan",
  YT: "Yukon",
};

const professionalThemes: Record<string, { accent: string; pale: string; text: string; border: string }> = {
  "Registered Dental Hygienist": { accent: "#4285F4", pale: "#EEF4FF", text: "#245FB8", border: "#4285F455" },
  "Certified Dental Assistant": { accent: "#EA4335", pale: "#FFF0EE", text: "#B52C22", border: "#EA433555" },
  "Dental Administrator": { accent: "#FBBC05", pale: "#FFF8DF", text: "#805F00", border: "#FBBC0566" },
  "Sterilization Technician": { accent: "#34A853", pale: "#ECF8EF", text: "#247A3B", border: "#34A85355" },
  "Associate Dentist": { accent: "#7C3AED", pale: "#F4EEFF", text: "#5B21B6", border: "#7C3AED55" },
};

function themeFor(profession: string) {
  return professionalThemes[profession] || { accent: "#01A32E", pale: "#EAF8EE", text: "#017F27", border: "#01A32E55" };
}

function payLabel(listing: Listing) {
  const min = listing.pay_min == null ? null : Number(listing.pay_min);
  const max = listing.pay_max == null ? null : Number(listing.pay_max);
  if (min == null && max == null) return "Compensation discussed privately";
  if (min != null && max != null) return `$${min}–$${max}/hr`;
  if (min != null) return `$${min}+/hr`;
  return `Up to $${max}/hr`;
}

function postedLabel(createdAt: string) {
  const created = new Date(createdAt).getTime();
  const days = Math.max(0, Math.floor((Date.now() - created) / 86400000));
  if (days === 0) return "Today";
  if (days === 1) return "1 day ago";
  return `${days} days ago`;
}

function applicationLabel(status?: string) {
  if (!status) return null;
  if (status === "pending") return "Pending";
  if (status === "interested") return "Interested";
  if (status === "declined") return "Not Interested";
  if (status === "withdrawn") return "Withdrawn";
  return status;
}

export function DentalJobsNativeMarketplace({ role }: { role: Role }) {
  const [listings, setListings] = useState<Listing[]>([]);
  const [applications, setApplications] = useState<ApplicationState[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<Listing | null>(null);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [actionError, setActionError] = useState("");

  const loadMarketplace = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Please sign in to view DentalJobs.");

      const details = await loadAccountDetails(user.id);
      const officeId = details.office?.id || null;
      const listingType = role === "professional" ? "office_hiring" : "professional_available";

      const [{ data: rawListings, error: listingError }, { data: distanceData, error: distanceError }] = await Promise.all([
        supabase
          .from("job_listings")
          .select("id,listing_type,profession,office_id,professional_id,employment_type,city,province,days_per_week,pay_min,pay_max,schedule,description,created_at")
          .eq("status", "active")
          .eq("listing_type", listingType)
          .gt("expires_at", new Date().toISOString())
          .order("created_at", { ascending: false }),
        supabase.rpc("get_dentaljobs_listing_distances"),
      ]);

      if (listingError) throw listingError;
      if (distanceError) throw distanceError;

      let rows = (rawListings || []) as Omit<Listing, "distance">[];

      if (role === "professional") {
        const { data: exclusions } = await supabase
          .from("professional_excluded_offices")
          .select("office_id")
          .eq("professional_id", user.id);
        const excluded = new Set((exclusions || []).map((row) => row.office_id).filter(Boolean));
        rows = rows.filter((row) => !row.office_id || !excluded.has(row.office_id));
      } else if (officeId) {
        const { data: exclusions } = await supabase
          .from("office_excluded_professionals")
          .select("matched_professional_id")
          .eq("office_id", officeId);
        const excluded = new Set((exclusions || []).map((row) => row.matched_professional_id).filter(Boolean));
        rows = rows.filter((row) => !row.professional_id || !excluded.has(row.professional_id));
      }

      const distanceByListing = new Map(
        ((distanceData || []) as DistanceRow[]).map((row) => [String(row.listing_id), row.distance_km == null ? null : Number(row.distance_km)])
      );

      const withDistance: Listing[] = rows.map((row) => ({
        ...row,
        distance: distanceByListing.get(String(row.id)) ?? null,
      }));

      if (role === "professional") {
        withDistance.sort((a, b) => {
          const aDistance = a.distance ?? Number.POSITIVE_INFINITY;
          const bDistance = b.distance ?? Number.POSITIVE_INFINITY;
          if (aDistance !== bDistance) return aDistance - bDistance;
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        });
      }

      let applicationQuery = supabase.from("job_applications").select("id,listing_id,status").is("deleted_at", null);
      applicationQuery = role === "professional"
        ? applicationQuery.eq("professional_id", user.id)
        : officeId
          ? applicationQuery.eq("office_id", officeId)
          : applicationQuery.eq("office_id", "00000000-0000-0000-0000-000000000000");
      const { data: existingApplications } = await applicationQuery;

      setApplications((existingApplications || []) as ApplicationState[]);
      setListings(withDistance);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to load DentalJobs right now.");
    } finally {
      setLoading(false);
    }
  }, [role]);

  useEffect(() => {
    void loadMarketplace();
    const channel = supabase
      .channel(`native-dentaljobs-${role}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "job_listings" }, () => void loadMarketplace())
      .on("postgres_changes", { event: "*", schema: "public", table: "job_applications" }, () => void loadMarketplace())
      .subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [loadMarketplace, role]);

  const grouped = useMemo(() => {
    if (role !== "office") return [];
    const provinceMap = new Map<string, Map<string, Listing[]>>();
    for (const listing of listings) {
      const province = String(listing.province || "").trim().toUpperCase();
      const city = String(listing.city || "").trim();
      if (!province || !city) continue;
      if (!provinceMap.has(province)) provinceMap.set(province, new Map());
      const cities = provinceMap.get(province)!;
      if (!cities.has(city)) cities.set(city, []);
      cities.get(city)!.push(listing);
    }
    return Array.from(provinceMap.entries())
      .map(([province, cities]) => ({
        province,
        label: provinceNames[province] || province,
        cities: Array.from(cities.entries()).map(([city, cityListings]) => ({ city, listings: cityListings })),
      }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [listings, role]);

  const applicationByListing = useMemo(
    () => new Map(applications.map((item) => [item.listing_id, item])),
    [applications]
  );

  const submitInterest = async () => {
    if (!selected || sending) return;
    setSending(true);
    setActionError("");

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Please sign in again.");

      const details = await loadAccountDetails(user.id);
      const officeId = role === "office" ? details.office?.id || null : selected.office_id;
      const professionalId = role === "professional" ? user.id : selected.professional_id;
      if (!officeId || !professionalId) throw new Error("This listing is missing account information needed to continue.");

      const { data, error: insertError } = await supabase
        .from("job_applications")
        .insert({
          listing_id: selected.id,
          professional_id: professionalId,
          office_id: officeId,
          initiator_role: role,
          status: "pending",
          message: message.trim(),
          resume_path_snapshot: role === "professional" ? details.professional?.resume_path || null : null,
        })
        .select("id,listing_id,status")
        .single();

      if (insertError) throw insertError;

      setApplications((current) => [
        ...current.filter((item) => item.listing_id !== selected.id),
        data as ApplicationState,
      ]);
      setSelected(null);
      setMessage("");
    } catch (caught) {
      setActionError(caught instanceof Error ? caught.message : "Unable to send your interest right now.");
    } finally {
      setSending(false);
    }
  };

  const submitOfficeInterest = async (listing: Listing) => {
    if (sending) return;
    setSending(true);
    setError("");

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Please sign in again.");

      const details = await loadAccountDetails(user.id);
      const officeId = details.office?.id || null;
      const professionalId = listing.professional_id;
      if (!officeId || !professionalId) throw new Error("This listing is missing account information needed to continue.");

      const { data: officePostings } = await supabase
        .from("job_listings")
        .select("id,profession,employment_type,city,province,days_per_week,pay_min,pay_max,schedule,created_at")
        .eq("office_id", officeId)
        .eq("listing_type", "office_hiring")
        .eq("status", "active")
        .gt("expires_at", new Date().toISOString())
        .order("created_at", { ascending: false });

      const sourcePosting = (officePostings || []).find((job) => job.profession === listing.profession) || (officePostings || [])[0] || null;
      const officeInterestSnapshot = sourcePosting
        ? { label: "Dental Office", city: sourcePosting.city, province: sourcePosting.province, profession: sourcePosting.profession, employment_type: sourcePosting.employment_type, days_per_week: sourcePosting.days_per_week, pay_min: sourcePosting.pay_min, pay_max: sourcePosting.pay_max, schedule: sourcePosting.schedule }
        : { label: "Dental Office", city: details.office?.city || details.profile.city || "", province: details.office?.province || details.profile.province || "", profession: listing.profession };

      const { data, error: insertError } = await supabase
        .from("job_applications")
        .insert({
          listing_id: listing.id,
          professional_id: professionalId,
          office_id: officeId,
          initiator_role: "office",
          status: "pending",
          message: "",
          resume_path_snapshot: null,
          source_office_listing_id: sourcePosting?.id || null,
          office_interest_snapshot: officeInterestSnapshot,
        })
        .select("id,listing_id,status")
        .single();

      if (insertError) throw insertError;

      setApplications((current) => [
        ...current.filter((item) => item.listing_id !== listing.id),
        data as ApplicationState,
      ]);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to send your interest right now.");
    } finally {
      setSending(false);
    }
  };

  const renderCard = (listing: Listing) => {
    const professionalCard = listing.listing_type === "professional_available";
    const theme = themeFor(listing.profession);
    const accent = professionalCard ? theme.accent : "#002757";
    const pale = professionalCard ? theme.pale : "#EDF3FA";
    const text = professionalCard ? theme.text : "#002757";
    const existing = applicationByListing.get(listing.id);
    const actionLabel = existing
      ? existing.status === "pending" && role === "office"
        ? "Awaiting Response"
        : applicationLabel(existing.status)
      : role === "professional"
        ? "I'm Interested"
        : "I'm Interested";

    return (
      <article
        key={listing.id}
        className="flex min-h-[320px] flex-col overflow-hidden rounded-2xl border bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
        style={{ borderColor: professionalCard ? theme.border : "#0027572e" }}
      >
        <div className="h-1.5" style={{ backgroundColor: accent }} />
        <div className="flex flex-1 flex-col p-4">
          <div className="flex items-start gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-white" style={{ backgroundColor: accent }}>
              {professionalCard ? <UserRound size={20} /> : <Building2 size={20} />}
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-[0.12em]" style={{ color: text }}>
                {professionalCard ? "Professional seeking office" : "Office hiring"}
              </p>
              <h3 className="mt-1 text-base font-black leading-5 text-[#002757]">
                {professionalCard ? `${listing.profession} Available` : `${listing.profession} — ${listing.employment_type}`}
              </h3>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2">
            <div className="rounded-xl bg-slate-50 px-3 py-2.5">
              <p className="text-[9px] font-black uppercase tracking-wide text-slate-400">Location</p>
              <p className="mt-1 flex items-center gap-1 text-xs font-bold text-slate-700">
                <MapPin size={12} />{listing.city}, {listing.province}
              </p>
            </div>
            <div className="rounded-xl bg-slate-50 px-3 py-2.5">
              <p className="text-[9px] font-black uppercase tracking-wide text-slate-400">{role === "office" ? "Distance from your office" : "Distance from your home"}</p>
              <p className="mt-1 text-xs font-bold text-slate-700">
                {listing.distance == null ? "Unavailable" : `${listing.distance.toFixed(1)} km away`}
              </p>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-1.5">
            <span className="rounded-lg px-2.5 py-1.5 text-[11px] font-black" style={{ backgroundColor: pale, color: text }}>
              {listing.employment_type}
            </span>
            <span className="rounded-lg bg-[#fff7df] px-2.5 py-1.5 text-[11px] font-black text-[#805F00]">{payLabel(listing)}</span>
            <span className="rounded-lg bg-slate-100 px-2.5 py-1.5 text-[11px] font-bold text-slate-500">
              <Clock3 size={11} className="mr-1 inline" />{postedLabel(listing.created_at)}
            </span>
          </div>

          <p className="mt-3 line-clamp-4 text-xs leading-5 text-slate-600">{listing.description}</p>

          <div className="mt-auto pt-4">
            <a
              href={`/jobs/${listing.id}?returnTo=${encodeURIComponent("/dental-jobs")}`}
              className="mb-3 inline-flex items-center gap-1.5 text-[11px] font-black text-[#002757] underline decoration-[#002757]/30 underline-offset-4 transition hover:text-[#01A32E]"
            >
              <Eye size={13} />View listing
            </a>
            <div className="flex items-center gap-2">
              <ShareListingButton listingId={listing.id} compact />
              <button
                type="button"
                disabled={Boolean(existing) || sending}
                onClick={() => {
                  if (role === "office") {
                    void submitOfficeInterest(listing);
                    return;
                  }
                  setSelected(listing);
                  setMessage("");
                  setActionError("");
                }}
                className="flex-1 rounded-xl px-3 py-2.5 text-xs font-black text-white shadow-sm transition hover:brightness-95 disabled:cursor-default disabled:opacity-65"
                style={{ backgroundColor: accent }}
              >
                {actionLabel}
              </button>
            </div>
          </div>
        </div>
      </article>
    );
  };

  return (
    <section className="bg-[#f5f8fb] px-4 py-7 sm:px-6 lg:px-8 lg:py-9">
      <div className="mx-auto max-w-[1500px]">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-2xl font-black text-[#002757] sm:text-3xl">DentalJobs Near You</h2>
            <p className="mt-1 text-sm font-semibold text-slate-500">
              {role === "professional"
                ? "Office opportunities are ranked from nearest to farthest using your account location."
                : "Dental professionals currently looking for an office."}
            </p>
          </div>
          {!loading && (
            <span className="rounded-full bg-white px-3 py-1.5 text-xs font-black text-slate-500 shadow-sm">
              {listings.length} active
            </span>
          )}
        </div>

        {error && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-bold text-rose-700">{error}</div>
        )}

        {loading ? (
          <div className="dentaljobs-listing-grid grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[0, 1, 2, 3].map((item) => (
              <div key={item} className="h-[320px] animate-pulse rounded-2xl border border-slate-200 bg-white" />
            ))}
          </div>
        ) : listings.length === 0 ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
            <BriefcaseBusiness className="mx-auto text-slate-300" size={36} />
            <h3 className="mt-3 text-lg font-black text-[#002757]">No matching DentalJobs listings right now</h3>
            <p className="mt-1 text-sm text-slate-500">New active listings will appear here automatically.</p>
          </div>
        ) : role === "professional" ? (
          <div className="dentaljobs-listing-grid grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{listings.map(renderCard)}</div>
        ) : (
          <div className="space-y-9">
            {grouped.map((province) => (
              <section key={province.province}>
                <div className="mb-4 flex items-end justify-between gap-3 border-b-2 border-[#002757] pb-2.5">
                  <h3 className="text-2xl font-black text-[#002757]">{province.label}</h3>
                  <span className="rounded-full bg-[#002757] px-3 py-1 text-xs font-black text-white">
                    {province.cities.reduce((sum, city) => sum + city.listings.length, 0)} active
                  </span>
                </div>
                <div className="space-y-6">
                  {province.cities.map((city) => (
                    <section key={`${province.province}-${city.city}`} className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
                      <div className="mb-4 flex items-center justify-between gap-3 border-b border-slate-200 pb-3">
                        <div className="flex items-center gap-2">
                          <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#edf3fa] text-[#002757]"><MapPin size={17} /></span>
                          <div>
                            <h4 className="text-xl font-black text-[#002757]">{city.city}</h4>
                            <p className="text-xs font-semibold text-slate-500">
                              {city.listings.length} active listing{city.listings.length === 1 ? "" : "s"}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="dentaljobs-listing-grid grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{city.listings.map(renderCard)}</div>
                    </section>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>

      {selected && (
        <div className="fixed inset-0 z-[120] overflow-y-auto bg-[#002757]/70 p-4">
          <button type="button" aria-label="Close" className="fixed inset-0" onClick={() => setSelected(null)} />
          <section role="dialog" aria-modal="true" className="relative mx-auto my-10 w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl">
            <div className="flex items-start justify-between gap-4 bg-[#002757] p-5 text-white">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.12em] text-[#9be3ad]">
                  {role === "professional" ? "Apply" : "Express Interest"}
                </p>
                <h3 className="mt-1 text-xl font-black">{selected.profession}</h3>
                <p className="mt-1 text-sm text-slate-300">{selected.city}, {selected.province}</p>
              </div>
              <button type="button" className="rounded-xl bg-white/10 p-2" onClick={() => setSelected(null)}>
                <X size={20} />
              </button>
            </div>
            <div className="p-5">
              <label className="text-sm font-black text-[#002757]" htmlFor="dentaljobs-native-message">Optional message</label>
              <textarea
                id="dentaljobs-native-message"
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                rows={5}
                maxLength={1000}
                className="mt-2 w-full resize-none rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#4285F4]"
                placeholder={role === "professional" ? "Add a short note to the dental office…" : "Add a short note to the professional…"}
              />
              {actionError && <p className="mt-3 rounded-xl bg-rose-50 p-3 text-sm font-bold text-rose-700">{actionError}</p>}
              <button
                type="button"
                disabled={sending}
                onClick={() => void submitInterest()}
                className="mt-4 w-full rounded-2xl bg-[#01A32E] px-5 py-3.5 text-sm font-black text-white shadow-md disabled:opacity-60"
              >
                {sending ? "Sending…" : role === "professional" ? "Submit Application" : "Send Interest"}
              </button>
            </div>
          </section>
        </div>
      )}
    </section>
  );
}
