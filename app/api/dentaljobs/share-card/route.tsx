import { ImageResponse } from "next/og";
import { createClient } from "@supabase/supabase-js";

export const runtime = "edge";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://pvugjtlmtlyfzyvvhcik.supabase.co";
const supabasePublishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "";

function theme(profession: string) {
  const map: Record<string, string> = {
    "Registered Dental Hygienist": "#4285F4",
    "Certified Dental Assistant": "#EA4335",
    "Dental Administrator": "#FBBC05",
    "Sterilization Technician": "#34A853",
    "Associate Dentist": "#7C3AED",
  };
  return map[profession] || "#01A32E";
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const id = url.searchParams.get("id") || "";
  const download = url.searchParams.get("download") === "1";
  const supabase = createClient(supabaseUrl, supabasePublishableKey, { auth: { persistSession: false } });
  const { data } = await supabase.from("job_listings").select("listing_type,profession,employment_type,city,province,days_per_week,pay_min,pay_max,schedule,description,status,expires_at").eq("id", id).maybeSingle();

  const profession = data?.profession || "Dental Opportunity";
  const isProfessional = data?.listing_type === "professional_available";
  const heading = isProfessional ? `${profession} Available` : `${profession} Wanted`;
  const location = data ? `${data.city}, ${data.province}` : "Canada";
  const pay = data?.pay_min != null || data?.pay_max != null
    ? `${data?.pay_min != null ? `$${Number(data.pay_min)}` : ""}${data?.pay_min != null && data?.pay_max != null ? "–" : ""}${data?.pay_max != null ? `$${Number(data.pay_max)}` : ""}/hr`
    : "";
  const accent = theme(profession);
  const logoUrl = new URL("/dentalshift-logo.svg", request.url).toString();

  const response = new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", background: "#ffffff", fontFamily: "Arial" }}>
      <div style={{ height: 18, width: "100%", background: accent }} />
      <div style={{ display: "flex", flexDirection: "column", padding: "58px 72px 46px", flex: 1 }}>
        <img src={logoUrl} width="360" height="120" style={{ objectFit: "contain", objectPosition: "left" }} />
        <div style={{ marginTop: 38, fontSize: 24, fontWeight: 800, color: accent, letterSpacing: 2 }}>{isProfessional ? "PROFESSIONAL SEEKING AN OFFICE" : "DENTAL OFFICE HIRING"}</div>
        <div style={{ marginTop: 16, fontSize: 58, lineHeight: 1.05, fontWeight: 900, color: "#002757", maxWidth: 980 }}>{heading}</div>
        <div style={{ marginTop: 24, fontSize: 34, fontWeight: 800, color: "#334155" }}>{location}</div>
        <div style={{ display: "flex", gap: 16, marginTop: 28, flexWrap: "wrap" }}>
          {data?.employment_type && <div style={{ padding: "12px 18px", borderRadius: 14, background: "#edf3fa", color: "#002757", fontSize: 23, fontWeight: 800 }}>{data.employment_type}</div>}
          {data?.days_per_week && <div style={{ padding: "12px 18px", borderRadius: 14, background: "#f1f5f9", color: "#475569", fontSize: 23, fontWeight: 800 }}>{data.days_per_week}</div>}
          {pay && <div style={{ padding: "12px 18px", borderRadius: 14, background: "#fff7df", color: "#805F00", fontSize: 23, fontWeight: 800 }}>{pay}</div>}
        </div>
        {data?.schedule && <div style={{ marginTop: 28, fontSize: 24, lineHeight: 1.35, color: "#475569", maxWidth: 960 }}>{data.schedule}</div>}
        <div style={{ marginTop: "auto", display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: "2px solid #e2e8f0", paddingTop: 28 }}>
          <div style={{ fontSize: 25, fontWeight: 800, color: "#002757" }}>View the anonymous listing on DentalShift</div>
          <div style={{ fontSize: 23, fontWeight: 900, color: "#01A32E" }}>DentalShift.ca</div>
        </div>
      </div>
    </div>,
    { width: 1200, height: 630 }
  );

  if (download) response.headers.set("Content-Disposition", `attachment; filename="dentalshift-job-${id || "share"}.png"`);
  response.headers.set("Cache-Control", "public, max-age=300, s-maxage=300");
  return response;
}
