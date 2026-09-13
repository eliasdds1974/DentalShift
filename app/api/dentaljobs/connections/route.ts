import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://pvugjtlmtlyfzyvvhcik.supabase.co";
const supabasePublishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "sb_publishable_cl7HUUywEucu1DsSbuaodA_oKo8qNFJ";

export async function GET(request: Request) {
  const authorization = request.headers.get("authorization") ?? "";
  if (!authorization.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Please sign in again." }, { status: 401 });
  }

  const token = authorization.slice("Bearer ".length);
  const requestClient = createClient(supabaseUrl, supabasePublishableKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: authorization } },
  });

  const { data: userData, error: userError } = await requestClient.auth.getUser(token);
  if (userError || !userData.user) {
    return NextResponse.json({ error: "Please sign in again." }, { status: 401 });
  }

  const { data: rows, error } = await requestClient.rpc("get_office_dentaljobs_connections");
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const connections = (rows || []).map((row: any) => {
    const snapshot = row.professional_interest_snapshot || null;
    return {
      id: row.id,
      listingId: row.listing_id,
      professionalId: row.professional_id,
      officeId: row.office_id,
      initiatorRole: row.initiator_role,
      status: row.status,
      message: row.message || "",
      resumePath: row.resume_path_snapshot || null,
      createdAt: row.created_at,
      profession: snapshot?.profession || "Dental Professional",
      employment: "",
      city: snapshot?.city || "",
      province: snapshot?.province || "",
      listingType: "office_hiring",
      sourceOfficeListingId: row.source_office_listing_id || null,
      candidatePreview: snapshot ? {
        profession: snapshot.profession || null,
        safeCity: snapshot.city || null,
        safeProvince: snapshot.province || null,
        yearsExperience: snapshot.years_experience == null ? null : Number(snapshot.years_experience),
        summary: snapshot.bio || "",
        experienceSummary: null,
        educationSummary: null,
        workHistorySummary: null,
        skills: Array.isArray(snapshot.skills) ? snapshot.skills : [],
        software: [],
        certifications: [],
      } : null,
      officeInterestSnapshot: row.office_interest_snapshot || null,
    };
  });

  return NextResponse.json({ connections });
}
