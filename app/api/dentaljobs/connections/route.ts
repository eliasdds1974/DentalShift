import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://pvugjtlmtlyfzyvvhcik.supabase.co";
const supabasePublishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "sb_publishable_cl7HUUywEucu1DsSbuaodA_oKo8qNFJ";
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

type ConnectionPayload = {
  id?: string | null;
  listingId?: string | null;
  professionalId?: string | null;
  officeId?: string | null;
  sourceOfficeListingId?: string | null;
  [key: string]: unknown;
};

export async function GET(request: Request) {
  const authorization = request.headers.get("authorization") ?? "";
  if (!authorization.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Please sign in again." }, { status: 401 });
  }

  const accessToken = authorization.slice("Bearer ".length);
  const requestClient = createClient(supabaseUrl, supabasePublishableKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: authorization } },
  });

  const { data: userData, error: userError } = await requestClient.auth.getUser(accessToken);
  if (userError || !userData.user) {
    return NextResponse.json({ error: "Please sign in again." }, { status: 401 });
  }

  const { data, error } = await requestClient.rpc("get_office_dentaljobs_connections_payload");
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const connections = (Array.isArray(data) ? data : []) as ConnectionPayload[];

  // The office card must always carry the real public.job_applications.id because
  // LET'S MATCH bills and completes a specific application. Normalize that ID on
  // the server so stale/legacy payload identifiers cannot reach the checkout route.
  if (serviceRoleKey && connections.length) {
    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: ownedOffices } = await admin
      .from("offices")
      .select("id")
      .eq("owner_id", userData.user.id);

    const officeIds = (ownedOffices || []).map((row) => String(row.id));

    if (officeIds.length) {
      const { data: applications } = await admin
        .from("job_applications")
        .select("id,listing_id,professional_id,office_id,source_office_listing_id,created_at")
        .in("office_id", officeIds)
        .is("deleted_at", null)
        .is("office_hidden_at", null)
        .order("created_at", { ascending: false });

      const rows = applications || [];

      for (const connection of connections) {
        const officeId = connection.officeId ? String(connection.officeId) : "";
        const professionalId = connection.professionalId ? String(connection.professionalId) : "";
        const listingId = connection.listingId ? String(connection.listingId) : "";
        const sourceOfficeListingId = connection.sourceOfficeListingId ? String(connection.sourceOfficeListingId) : "";

        const exact = rows.find((row) =>
          String(row.office_id) === officeId &&
          String(row.professional_id) === professionalId &&
          String(row.listing_id) === listingId &&
          String(row.source_office_listing_id || "") === sourceOfficeListingId
        );

        const relaxed = exact || rows.find((row) =>
          String(row.office_id) === officeId &&
          String(row.professional_id) === professionalId &&
          (
            String(row.listing_id) === listingId ||
            String(row.source_office_listing_id || "") === sourceOfficeListingId
          )
        );

        const professionalMatch = relaxed || rows.find((row) =>
          String(row.office_id) === officeId &&
          String(row.professional_id) === professionalId
        );

        if (professionalMatch) {
          connection.id = String(professionalMatch.id);
          connection.applicationId = String(professionalMatch.id);
        }
      }
    }
  }

  return NextResponse.json(
    { connections },
    { headers: { "Cache-Control": "private, no-store, max-age=0" } },
  );
}
