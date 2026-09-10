import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://pvugjtlmtlyfzyvvhcik.supabase.co";
const supabasePublishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "sb_publishable_cl7HUUywEucu1DsSbuaodA_oKo8qNFJ";
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function getAdmin(request: Request) {
  const authorization = request.headers.get("authorization") ?? "";
  if (!authorization.startsWith("Bearer ") || !serviceRoleKey) return null;
  const token = authorization.slice(7);
  const requestClient = createClient(supabaseUrl, supabasePublishableKey, { auth: { persistSession: false, autoRefreshToken: false }, global: { headers: { Authorization: authorization } } });
  const admin = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: userData } = await requestClient.auth.getUser(token);
  if (!userData.user) return null;
  const { data: profile } = await admin.from("profiles").select("role").eq("id", userData.user.id).maybeSingle();
  if (profile?.role !== "admin") return null;
  return { admin, userId: userData.user.id };
}

export async function GET(request: Request) {
  const ctx = await getAdmin(request);
  if (!ctx) return NextResponse.json({ error: "Administrator access required." }, { status: 403 });
  const view = new URL(request.url).searchParams.get("view") ?? "";
  const admin = ctx.admin;
  try {
    if (view === "verification") {
      const [{ data: professionals }, { data: offices }] = await Promise.all([
        admin.from("professional_profiles").select("user_id,profession,licence_number,licence_province,licence_status,cpr_status,local_anesthetic_status,profiles(first_name,last_name,city,province)").order("user_id", { ascending: false }).limit(300),
        admin.from("offices").select("id,name,city,province,verification_status,communication_email,submitted_for_verification_at").order("created_at", { ascending: false }).limit(300),
      ]);
      return NextResponse.json({ professionals: professionals ?? [], offices: offices ?? [] });
    }
    if (view === "shifts") {
      const [{ data: shifts }, { data: bookings }] = await Promise.all([
        admin.from("shifts").select("id,office_id,profession,starts_at,ends_at,hourly_rate,status,filled_by,created_at,required_software,replacement_priority,interest_only,offices(name,city,province)").order("starts_at", { ascending: false }).limit(500),
        admin.from("bookings").select("id,shift_id,office_id,professional_id,confirmed_at,check_in_at,check_out_at,cancelled_at,cancellation_reason,replacement_status").order("confirmed_at", { ascending: false }).limit(500),
      ]);
      return NextResponse.json({ shifts: shifts ?? [], bookings: bookings ?? [] });
    }
    if (view === "disputes") {
      const { data } = await admin.from("disputes").select("id,booking_id,opened_by,category,details,status,resolution,created_at,resolved_at,bookings(shift_id,office_id,professional_id,shifts(profession,starts_at,offices(name)))").order("created_at", { ascending: false }).limit(300);
      return NextResponse.json({ disputes: data ?? [] });
    }
    if (view === "dentaljobs") {
      const [{ data: listings }, { data: applications }, { data: unlocks }] = await Promise.all([
        admin.from("job_listings").select("id,listing_type,profession,office_id,professional_id,employment_type,city,province,status,created_at,expires_at,offices(name)").order("created_at", { ascending: false }).limit(500),
        admin.from("job_applications").select("id,listing_id,professional_id,office_id,initiator_role,status,created_at,responded_at,job_listings(profession,employment_type,city,province)").order("created_at", { ascending: false }).limit(500),
        admin.from("candidate_unlocks").select("id,application_id,office_id,professional_id,amount_cents,currency,status,billing_period,created_at,paid_at,offices(name)").order("created_at", { ascending: false }).limit(500),
      ]);
      return NextResponse.json({ listings: listings ?? [], applications: applications ?? [], unlocks: unlocks ?? [] });
    }
    return NextResponse.json({ error: "Unknown admin view." }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Admin data could not be loaded." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const ctx = await getAdmin(request);
  if (!ctx) return NextResponse.json({ error: "Administrator access required." }, { status: 403 });
  const body = await request.json().catch(() => null) as any;
  const admin = ctx.admin;
  try {
    if (body?.action === "resolve_dispute") {
      const id = String(body.id || "");
      const resolution = String(body.resolution || "").trim();
      if (!id || resolution.length < 3) return NextResponse.json({ error: "Enter a resolution." }, { status: 400 });
      const { error } = await admin.from("disputes").update({ status: "resolved", resolution, resolved_at: new Date().toISOString() }).eq("id", id);
      if (error) throw error;
      return NextResponse.json({ ok: true });
    }
    if (body?.action === "set_listing_status") {
      const id = String(body.id || "");
      const status = String(body.status || "");
      if (!id || !["active","paused","closed"].includes(status)) return NextResponse.json({ error: "Invalid listing status." }, { status: 400 });
      const patch: Record<string, unknown> = { status, updated_at: new Date().toISOString() };
      if (status === "closed") patch.closed_at = new Date().toISOString();
      const { error } = await admin.from("job_listings").update(patch).eq("id", id);
      if (error) throw error;
      return NextResponse.json({ ok: true });
    }
    return NextResponse.json({ error: "Unknown admin action." }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Admin action failed." }, { status: 500 });
  }
}
