import { NextResponse } from "next/server";
import { useFakeTeslaApi } from "@/lib/tesla/config";
import { fakeConnectCable } from "@/lib/fakeTesla/fakeVehicleData";

export const runtime = "nodejs";

/** Dev-only: lets the UI simulate "cable plugged in" instead of waiting on a timer. */
export async function POST() {
  if (!useFakeTeslaApi) {
    return NextResponse.json({ error: "not_available" }, { status: 404 });
  }
  fakeConnectCable();
  return NextResponse.json({ ok: true });
}
