import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

function cleanHeaderValue(value: string | undefined | null) {
  return (value ?? "").replace(/[\u0000-\u001F\u007F]/g, "").trim();
}

const supabaseUrl = cleanHeaderValue(process.env.NEXT_PUBLIC_SUPABASE_URL) || "https://pvugjtlmtlyfzyvvhcik.supabase.co";
const supabasePublishableKey = cleanHeaderValue(process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) || "sb_publishable_cl7HUUywEucu1DsSbuaodA_oKo8qNFJ";

type ConnectionPayload = {
  id?: string | null;
  [key: string]: unknown;
};

export async function GET(request: Request) {
  const authorization = cleanHeaderValue(request.headers.get("authorization"));
  if (!authorization.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Please sign in again." }, { status: 401 });
  }

  try {
    const requestClient = createClient(supabaseUrl, supabasePublishableKey, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { headers: { Authorization: authorization } },
    });

    const { data: userData, error: userError } = await requestClient.auth.getUser();
    if (userError || !userData.user) {
      return NextResponse.json({ error: "Please sign in again." }, { status: 401 });
    }

    const { data, error } = await requestClient.rpc("get_office_dentaljobs_connections_payload");
    if (error) {
      console.error("[dentaljobs-connections] rpc error", error);
      return NextResponse.json({ error: "Could not load interested professionals." }, { status: 400 });
    }

    const connections = ((Array.isArray(data) ? data : []) as ConnectionPayload[]).map((connection) => ({
      ...connection,
      applicationId: connection.id ? String(connection.id) : null,
    }));

    return NextResponse.json(
      { connections },
      { headers: { "Cache-Control": "private, no-store, max-age=0" } },
    );
  } catch (error) {
    console.error("[dentaljobs-connections] unexpected error", error);
    return NextResponse.json({ error: "Could not load interested professionals." }, { status: 500 });
  }
}
