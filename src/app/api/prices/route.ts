import { NextResponse } from "next/server";
import { fetchTgjuSnapshot } from "@/lib/tgju";

export async function GET() {
  try {
    const snapshot = await fetchTgjuSnapshot();
    return NextResponse.json(snapshot, {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "خطا در دریافت قیمت از TGJU";
    return NextResponse.json(
      {
        error: message,
        source: "tgju.org",
        hint: "https://www.tgju.org",
      },
      { status: 502 },
    );
  }
}
