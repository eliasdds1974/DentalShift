import { NextResponse } from "next/server";

type AddressComponent = {
  longText?: string;
  shortText?: string;
  types?: string[];
};

function component(components: AddressComponent[], type: string, short = false) {
  const match = components.find((item) => item.types?.includes(type));
  return short ? match?.shortText || match?.longText || "" : match?.longText || "";
}

export async function POST(request: Request) {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY || process.env.OOGLE_MAPS_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Google address details are not configured." }, { status: 503 });
  }

  const { placeId, sessionToken } = await request.json();
  const id = String(placeId || "").trim();
  if (!id || id.length > 300) {
    return NextResponse.json({ error: "A valid place selection is required." }, { status: 400 });
  }

  const response = await fetch(`https://places.googleapis.com/v1/places/${encodeURIComponent(id)}`, {
    headers: {
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask": "id,displayName,formattedAddress,addressComponents,location,types,websiteUri",
      "X-Goog-Maps-Session-Token": String(sessionToken || ""),
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const message = await response.text();
    console.error("[google-address-details] request failed", response.status, message.slice(0, 500));
    return NextResponse.json({ error: "The selected address could not be verified." }, { status: 502 });
  }

  const place = await response.json() as {
    id?: string;
    displayName?: { text?: string };
    formattedAddress?: string;
    addressComponents?: AddressComponent[];
    location?: { latitude?: number; longitude?: number };
    types?: string[];
    websiteUri?: string;
  };
  const components = place.addressComponents || [];
  const streetNumber = component(components, "street_number");
  const route = component(components, "route");
  const subpremise = component(components, "subpremise");
  const street = [streetNumber, route].filter(Boolean).join(" ");
  const address = [street, subpremise ? `Unit ${subpremise}` : ""].filter(Boolean).join(", ");

  return NextResponse.json({
    placeId: place.id || id,
    name: place.displayName?.text || "",
    formattedAddress: place.formattedAddress || "",
    address: address || place.formattedAddress || "",
    city: component(components, "locality") || component(components, "postal_town") || component(components, "administrative_area_level_2"),
    province: component(components, "administrative_area_level_1", true),
    postalCode: component(components, "postal_code"),
    country: component(components, "country", true),
    latitude: place.location?.latitude ?? null,
    longitude: place.location?.longitude ?? null,
    types: place.types || [],
    website: place.websiteUri || "",
  });
}
