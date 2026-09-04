import { NextResponse } from "next/server";

type GooglePrediction = {
  placePrediction?: {
    placeId?: string;
    text?: { text?: string };
    structuredFormat?: {
      mainText?: { text?: string };
      secondaryText?: { text?: string };
    };
  };
};

export async function POST(request: Request) {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY || process.env.OOGLE_MAPS_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Google address suggestions are not configured." }, { status: 503 });
  }

  const { input, sessionToken } = await request.json();
  const search = String(input || "").trim();
  if (search.length < 3 || search.length > 160) {
    return NextResponse.json({ suggestions: [] });
  }

  const response = await fetch("https://places.googleapis.com/v1/places:autocomplete", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
    },
    body: JSON.stringify({
      input: search,
      includedRegionCodes: ["ca"],
      languageCode: "en",
      regionCode: "CA",
      sessionToken: String(sessionToken || ""),
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    const message = await response.text();
    console.error("[google-address-autocomplete] request failed", response.status, message.slice(0, 500));
    return NextResponse.json({ error: "Address suggestions are temporarily unavailable." }, { status: 502 });
  }

  const data = await response.json() as { suggestions?: GooglePrediction[] };
  const suggestions = (data.suggestions || []).flatMap((entry) => {
    const prediction = entry.placePrediction;
    if (!prediction?.placeId) return [];
    return [{
      placeId: prediction.placeId,
      label: prediction.text?.text || "",
      mainText: prediction.structuredFormat?.mainText?.text || prediction.text?.text || "",
      secondaryText: prediction.structuredFormat?.secondaryText?.text || "",
    }];
  });

  return NextResponse.json({ suggestions });
}
