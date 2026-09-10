import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://pvugjtlmtlyfzyvvhcik.supabase.co";
const supabasePublishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "sb_publishable_cl7HUUywEucu1DsSbuaodA_oKo8qNFJ";
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function POST(request: Request) {
  const authorization = request.headers.get("authorization") ?? "";
  if (!authorization.startsWith("Bearer ")) return NextResponse.json({ error: "Please sign in again." }, { status: 401 });
  if (!serviceRoleKey) return NextResponse.json({ error: "Candidate unlocks are not configured yet." }, { status: 503 });
  const accessToken = authorization.slice("Bearer ".length);
  const requestClient = createClient(supabaseUrl, supabasePublishableKey, { auth: { persistSession: false, autoRefreshToken: false }, global: { headers: { Authorization: authorization } } });
  const admin = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: userData, error: userError } = await requestClient.auth.getUser(accessToken);
  if (userError || !userData.user) return NextResponse.json({ error: "Please sign in again." }, { status: 401 });
  const body = await request.json().catch(() => null) as { applicationId?: string } | null;
  const applicationId = body?.applicationId?.trim();
  if (!applicationId) return NextResponse.json({ error: "Application is required." }, { status: 400 });
  const { data: application } = await admin.from("job_applications").select("id,office_id,professional_id").eq("id", applicationId).maybeSingle();
  if (!application) return NextResponse.json({ error: "Application not found." }, { status: 404 });
  const { data: office } = await admin.from("offices").select("id,owner_id").eq("id", application.office_id).maybeSingle();
  if (!office || office.owner_id !== userData.user.id) return NextResponse.json({ error: "Only this dental office can view the unlocked candidate." }, { status: 403 });
  const { data: unlock } = await admin.from("candidate_unlocks").select("status,created_at").eq("office_id", application.office_id).eq("professional_id", application.professional_id).in("status", ["accrued","billed","paid"]).maybeSingle();
  if (!unlock) return NextResponse.json({ unlocked: false }, { status: 402 });
  const [{ data: profile }, { data: professional }, { data: authUser }] = await Promise.all([
    admin.from("profiles").select("first_name,last_name,phone,address,city,province,postal_code").eq("id", application.professional_id).maybeSingle(),
    admin.from("professional_profiles").select("profession,licence_number,licence_province,resume_path").eq("user_id", application.professional_id).maybeSingle(),
    admin.auth.admin.getUserById(application.professional_id),
  ]);
  let resumeUrl: string | null = null;
  if (professional?.resume_path) {
    const { data: signed } = await admin.storage.from("professional-resumes").createSignedUrl(professional.resume_path, 900);
    resumeUrl = signed?.signedUrl ?? null;
  }
  const name = [profile?.first_name, profile?.last_name].filter(Boolean).join(" ").trim();
  return NextResponse.json({ unlocked: true, unlockedAt: unlock.created_at, candidate: { name: name || "Dental Professional", email: authUser.user?.email ?? null, phone: profile?.phone ?? null, city: profile?.city ?? null, province: profile?.province ?? null, address: profile?.address ?? null, postalCode: profile?.postal_code ?? null, profession: professional?.profession ?? null, licenceNumber: professional?.licence_number ?? null, licenceProvince: professional?.licence_province ?? null, resumeUrl } });
}
