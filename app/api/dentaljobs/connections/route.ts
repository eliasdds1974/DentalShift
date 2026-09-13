import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://pvugjtlmtlyfzyvvhcik.supabase.co";
const supabasePublishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "sb_publishable_cl7HUUywEucu1DsSbuaodA_oKo8qNFJ";
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function GET(request: Request) {
  const authorization = request.headers.get("authorization") ?? "";
  if (!authorization.startsWith("Bearer ")) return NextResponse.json({ error: "Please sign in again." }, { status: 401 });
  if (!serviceRoleKey) return NextResponse.json({ error: "DentalJobs connections are not configured." }, { status: 503 });

  const token = authorization.slice("Bearer ".length);
  const requestClient = createClient(supabaseUrl, supabasePublishableKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: authorization } },
  });
  const admin = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } });

  const { data: userData, error: userError } = await requestClient.auth.getUser(token);
  if (userError || !userData.user) return NextResponse.json({ error: "Please sign in again." }, { status: 401 });

  const userId = userData.user.id;
  const { data: office } = await admin.from("offices").select("id").eq("owner_id", userId).maybeSingle();
  if (!office?.id) return NextResponse.json({ connections: [] });

  const { data: apps, error: appsError } = await admin
    .from("job_applications")
    .select("id,listing_id,professional_id,office_id,initiator_role,status,message,resume_path_snapshot,created_at,source_office_listing_id,office_interest_snapshot,professional_interest_snapshot")
    .eq("office_id", office.id)
    .is("deleted_at", null)
    .is("office_hidden_at", null)
    .order("created_at", { ascending: false });
  if (appsError) return NextResponse.json({ error: appsError.message }, { status: 400 });

  const rows = apps || [];
  const listingIds = [...new Set(rows.map((r) => String(r.listing_id)).filter(Boolean))];
  const professionalIds = [...new Set(rows.map((r) => String(r.professional_id)).filter(Boolean))];

  const listingMap = new Map<string, any>();
  if (listingIds.length) {
    const { data } = await admin.from("job_listings").select("id,profession,employment_type,city,province,listing_type").in("id", listingIds);
    for (const row of data || []) listingMap.set(String(row.id), row);
  }

  const previewMap = new Map<string, any>();
  if (professionalIds.length) {
    const { data } = await admin
      .from("candidate_previews")
      .select("professional_id,profession,safe_city,safe_province,years_experience,summary,experience_summary,education_summary,work_history_summary,skills,software,certifications")
      .in("professional_id", professionalIds);
    for (const row of data || []) previewMap.set(String(row.professional_id), row);
  }

  const connections = rows.map((row: any) => {
    const listing = listingMap.get(String(row.listing_id));
    const preview = previewMap.get(String(row.professional_id));
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
      profession: listing?.profession || "Dental position",
      employment: listing?.employment_type || "",
      city: listing?.city || "",
      province: listing?.province || "",
      listingType: listing?.listing_type || "office_hiring",
      sourceOfficeListingId: row.source_office_listing_id || null,
      candidatePreview: preview ? {
        profession: preview.profession || null,
        safeCity: preview.safe_city || null,
        safeProvince: preview.safe_province || null,
        yearsExperience: preview.years_experience == null ? null : Number(preview.years_experience),
        summary: preview.summary || "",
        experienceSummary: preview.experience_summary || null,
        educationSummary: preview.education_summary || null,
        workHistorySummary: preview.work_history_summary || null,
        skills: preview.skills || [],
        software: preview.software || [],
        certifications: preview.certifications || [],
      } : snapshot ? {
        profession: snapshot.profession || listing?.profession || null,
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
