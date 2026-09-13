import { supabase } from "./supabase";
import * as dentalshift from "./dentalshift";
import type { AccountDetails, AccountProfile, OfficeDetails, ProfessionalDetails } from "./dentalshift";

export * from "./dentalshift";

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      window.setTimeout(() => reject(new Error(`${label} timed out.`)), ms);
    }),
  ]);
}

async function loadAccountDetailsFallback(userId: string): Promise<AccountDetails> {
  const { data: profileData, error: profileError } = await withTimeout(
    supabase
      .from("profiles")
      .select("id,role,first_name,last_name,city,province,phone,postal_code,address,google_place_id,latitude,longitude")
      .eq("id", userId)
      .single(),
    5000,
    "Profile request",
  );

  if (profileError || !profileData) throw profileError || new Error("Your DentalShift profile could not be loaded.");
  const profile = profileData as AccountProfile;

  const professionalPromise = withTimeout(
    supabase
      .from("professional_profiles")
      .select("user_id,profession,licence_number,licence_province,licence_status,hourly_rate,travel_radius_km,years_experience,languages,bio,skills,cpr_path,cpr_status,cpr_expiry_month,cpr_submitted_at,cpr_grace_until,cpr_verified_at,resume_path,available_for_work,local_anesthetic,local_anesthetic_status")
      .eq("user_id", userId)
      .maybeSingle(),
    5000,
    "Professional profile request",
  ).catch(() => ({ data: null, error: null }));

  const officePromise = withTimeout(
    supabase
      .from("offices")
      .select("id,owner_id,name,address,city,province,postal_code,google_place_id,latitude,longitude,phone,communication_email,website,software,description,verification_status,contact_name,contact_title,contact_phone,office_hours,operatories,parking_info,languages,benefits,authorization_confirmed,submitted_for_verification_at,logo_url,search_radius_km")
      .eq("owner_id", userId)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle(),
    5000,
    "Office profile request",
  ).catch(() => ({ data: null, error: null }));

  const [professionalResult, officeResult] = await Promise.all([professionalPromise, officePromise]);
  const professional = (professionalResult.data || null) as ProfessionalDetails | null;
  const office = (officeResult.data || null) as OfficeDetails | null;

  let verificationRequest: { notes: string; created_at: string } | null = null;
  if (professional?.licence_status === "needs_review") {
    try {
      const { data } = await withTimeout(
        supabase
          .from("verification_decisions")
          .select("notes,created_at")
          .eq("target_kind", "professional")
          .eq("target_id", userId)
          .eq("new_status", "needs_review")
          .not("notes", "is", null)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
        4000,
        "Verification request",
      );
      verificationRequest = data?.notes ? { notes: data.notes, created_at: data.created_at } : null;
    } catch {
      verificationRequest = null;
    }
  }

  return { profile, professional, office, verificationRequest };
}

export async function loadAccountDetails(userId: string): Promise<AccountDetails> {
  try {
    return await withTimeout(dentalshift.loadAccountDetails(userId), 6500, "Account request");
  } catch {
    return loadAccountDetailsFallback(userId);
  }
}
