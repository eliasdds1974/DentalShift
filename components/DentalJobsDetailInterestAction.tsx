"use client";

import { useEffect, useState } from "react";
import { loadAccountDetails } from "@/lib/dentalshift";
import { supabase } from "@/lib/supabase";

type ListingType = "office_hiring" | "professional_available";
type ConnectionStatus = "pending" | "interested" | "declined" | "withdrawn";

type Props = {
  listingId: string;
  listingType: ListingType;
  profession: string;
  signedOutLabel: string;
};

function statusLabel(status: ConnectionStatus | null) {
  if (status === "pending") return "Awaiting Response";
  if (status === "interested") return "Mutual Interest";
  if (status === "declined") return "Not Interested";
  if (status === "withdrawn") return "Withdrawn";
  return null;
}

export function DentalJobsDetailInterestAction({ listingId, listingType, profession, signedOutLabel }: Props) {
  const [busy, setBusy] = useState(false);
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const [role, setRole] = useState<"office" | "professional" | "admin" | null>(null);
  const [status, setStatus] = useState<ConnectionStatus | null>(null);
  const [error, setError] = useState("");

  const refresh = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setSignedIn(false);
      setRole(null);
      setStatus(null);
      return;
    }

    setSignedIn(true);
    const details = await loadAccountDetails(user.id);
    setRole(details.profile.role);

    let query = supabase
      .from("job_applications")
      .select("status")
      .eq("listing_id", listingId)
      .is("deleted_at", null);

    if (details.profile.role === "professional") {
      query = query.eq("professional_id", user.id);
    } else if (details.profile.role === "office" && details.office?.id) {
      query = query.eq("office_id", details.office.id);
    } else {
      setStatus(null);
      return;
    }

    const { data } = await query.order("created_at", { ascending: false }).limit(1).maybeSingle();
    setStatus((data?.status as ConnectionStatus | undefined) ?? null);
  };

  useEffect(() => {
    void refresh();
  }, [listingId]);

  const sendInterest = async () => {
    if (busy) return;
    setError("");

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      window.location.assign("/?signin=1");
      return;
    }

    if (status) return;

    setBusy(true);
    try {
      const details = await loadAccountDetails(user.id);

      if (details.profile.role === "professional" && listingType === "office_hiring") {
        const { data: listing, error: listingError } = await supabase
          .from("job_listings")
          .select("office_id,profession")
          .eq("id", listingId)
          .single();
        if (listingError || !listing?.office_id) throw new Error("This position is not available for interest right now.");

        const { error: insertError } = await supabase.from("job_applications").insert({
          listing_id: listingId,
          professional_id: user.id,
          office_id: listing.office_id,
          initiator_role: "professional",
          status: "pending",
          message: "",
          resume_path_snapshot: details.professional?.resume_path || null,
          professional_interest_snapshot: {
            label: "Dental Professional",
            city: details.profile.city || null,
            province: details.profile.province || null,
            profession: details.professional?.profession || listing.profession || profession || null,
            years_experience: details.professional?.years_experience ?? null,
            bio: details.professional?.bio || null,
            skills: details.professional?.skills || [],
            languages: details.professional?.languages || [],
          },
        });
        if (insertError) {
          if (insertError.code === "23505") {
            await refresh();
            return;
          }
          throw insertError;
        }
      } else if (details.profile.role === "office" && listingType === "professional_available") {
        if (!details.office?.id) throw new Error("Your dental office account could not be found.");

        const { data: listing, error: listingError } = await supabase
          .from("job_listings")
          .select("professional_id,profession")
          .eq("id", listingId)
          .single();
        if (listingError || !listing?.professional_id) throw new Error("This professional listing is not available for interest right now.");

        const { data: officePostings } = await supabase
          .from("job_listings")
          .select("id,profession,employment_type,city,province,days_per_week,pay_min,pay_max,schedule,created_at")
          .eq("office_id", details.office.id)
          .eq("listing_type", "office_hiring")
          .eq("status", "active")
          .gt("expires_at", new Date().toISOString())
          .order("created_at", { ascending: false });

        const sourcePosting = (officePostings || []).find((job: any) => job.profession === listing.profession) || (officePostings || [])[0] || null;
        const officeInterestSnapshot = sourcePosting ? {
          label: "Dental Office",
          city: sourcePosting.city,
          province: sourcePosting.province,
          profession: sourcePosting.profession,
          employment_type: sourcePosting.employment_type,
          days_per_week: sourcePosting.days_per_week,
          pay_min: sourcePosting.pay_min,
          pay_max: sourcePosting.pay_max,
          schedule: sourcePosting.schedule,
        } : {
          label: "Dental Office",
          city: details.office.city || details.profile.city || null,
          province: details.office.province || details.profile.province || null,
          profession: listing.profession || profession || null,
        };

        const { error: insertError } = await supabase.from("job_applications").insert({
          listing_id: listingId,
          professional_id: listing.professional_id,
          office_id: details.office.id,
          initiator_role: "office",
          status: "pending",
          message: null,
          resume_path_snapshot: null,
          source_office_listing_id: sourcePosting?.id || null,
          office_interest_snapshot: officeInterestSnapshot,
        });
        if (insertError) {
          if (insertError.code === "23505") {
            await refresh();
            return;
          }
          throw insertError;
        }
      } else {
        throw new Error("This interest action is not available from your current account.");
      }

      setStatus("pending");
    } catch (value) {
      setError(value instanceof Error ? value.message : "Unable to send your interest right now.");
    } finally {
      setBusy(false);
    }
  };

  const existingLabel = statusLabel(status);
  const defaultLabel = listingType === "office_hiring" ? "Apply to this Position" : "I'm Interested";
  const label = existingLabel || (signedIn === false ? signedOutLabel : defaultLabel);
  const invalidRole = signedIn === true && (
    (listingType === "office_hiring" && role !== "professional") ||
    (listingType === "professional_available" && role !== "office")
  );

  return <div className="min-w-0">
    <button
      type="button"
      onClick={() => void sendInterest()}
      disabled={busy || Boolean(status) || invalidRole || signedIn === null}
      className={`inline-flex min-h-12 w-full items-center justify-center rounded-xl px-5 py-3 text-center font-black text-white shadow-sm disabled:cursor-default disabled:opacity-80 ${status === "pending" ? "bg-[#EA4335]" : status === "interested" ? "bg-[#01A32E]" : "bg-[#01A32E]"}`}
    >
      {busy ? "Sending…" : invalidRole ? "Not Available for This Account" : label}
    </button>
    {error && <p className="mt-2 text-center text-xs font-bold text-rose-600">{error}</p>}
  </div>;
}
