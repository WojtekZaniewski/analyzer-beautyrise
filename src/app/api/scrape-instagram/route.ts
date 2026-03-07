import { NextResponse } from "next/server";
import { scrapeInstagram } from "@/lib/instagram";

export async function POST(req: Request) {
  try {
    const { handle } = await req.json();

    if (!handle || typeof handle !== "string") {
      return NextResponse.json(
        { error: "Podaj handle Instagram" },
        { status: 400 }
      );
    }

    const profile = await scrapeInstagram(handle);

    if (!profile) {
      return NextResponse.json(
        { error: "Nie udalo sie pobrac danych z Instagrama" },
        { status: 404 }
      );
    }

    return NextResponse.json(profile);
  } catch (error) {
    console.error("Instagram scrape error:", error);
    return NextResponse.json(
      { error: "Blad podczas pobierania danych z Instagrama" },
      { status: 500 }
    );
  }
}
