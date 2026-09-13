import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://pvugjtlmtlyfzyvvhcik.supabase.co";
const supabasePublishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "sb_publishable_cl7HUUywEucu1DsSbuaodA_oKo8qNFJ";
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

function distanceKm(lat1?: number | null, lon1?: number | null, lat2?: number | null, lon2?: number | null) {
  if ([lat1, lon1, lat2, lon2].some((value) => value == null || !Number.isFinite(Number(value)))) return null;
  const toRad = (value: number) => (value * Math.PI) / 180;
  const earthKm = 6371;
  const dLat = toRad(Number(lat2) - Number(lat1));
  const dLon = toRad(Number(lon2) - Number(lon1));
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(Number(lat1))) * Math.cos(toRad(Number(lat2))) * Math.sin(dLon / 2) ** 2;
  return earthKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

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

  const profileMap = new Map<string, { latitude: number | null; longitude: number | null }>();
  const professionalMap = new Map<string, { languages: string[] }>();
  const officeMap = new Map<string, { latitude: number | null; longitude: number | null }>();

  if (serviceRoleKey && rows?.length) {
    const admin = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } });
    const professionalIds = [...new Set((rows || []).map((row: any) => String(row.professional_id)).filter(Boolean))];
    const officeIds = [...new Set((rows || []).map((row: any) => String(row.office_id)).filter(Boolean))];

    const [{ data: profiles }, { data: professionalProfiles }, { data: offices }] = await Promise.all([
      professionalIds.length ? admin.from("profiles").select("id,latitude,longitude").in("id", professionalIds) : Promise.resolve({ data: [] as any[] }),
      professionalIds.length ? admin.from("professional_profiles").select("user_id,languages").in("user_id", professionalIds) : Promise.resolve({ data: [] as any[] }),
      officeIds.length ? admin.from("offices").select("id,latitude,longitude").in("id", officeIds) : Promise.resolve({ data: [] as any[] }),
    ]);

    for (const profile of profiles || []) {
      profileMap.set(String(profile.id), { latitude: profile.latitude ?? null, longitude: profile.longitude ?? null });
    }
    for (const professional of professionalProfiles || []) {
      professionalMap.set(String(professional.user_id), { languages: Array.isArray(professional.languages) ? professional.languages : [] });
    }
    for (const office of offices || []) {
      officeMap.set(String(office.id), { latitude: office.latitude ?? null, longitude: office.longitude ?? null });
    }
  }

  const connections = (rows || []).map((row: any) => {
    const snapshot = row.professional_interest_snapshot || null;
    const professionalLocation = profileMap.get(String(row.professional_id));
    const officeLocation = officeMap.get(String(row.office_id));
    const calculatedDistance = distanceKm(
      officeLocation?.latitude,
      officeLocation?.longitude,
      professionalLocation?.latitude,
      professionalLocation?.longitude,
    );
    const languages = professionalMap.get(String(row.professional_id))?.languages || [];

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
        languages,
        distanceKm: calculatedDistance == null ? null : Math.round(calculatedDistance * 10) / 10,
      } : null,
      officeInterestSnapshot: row.office_interest_snapshot || null,
    };
  });

  return NextResponse.json({ connections });
}
