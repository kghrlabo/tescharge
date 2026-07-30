import { NextResponse } from "next/server";
import { getSession } from "@/lib/session/cookie";
import { isConnected } from "@/lib/session/types";
import { useFakeTeslaApi } from "@/lib/tesla/config";
import { fakeListScenarios } from "@/lib/fakeTesla/fakeVehicleData";

export const runtime = "nodejs";

export async function GET() {
  const session = await getSession();
  const connected = isConnected(session);

  return NextResponse.json({
    connected,
    vehicleName: connected ? session.vehicleDisplayName : null,
    expiresAt: connected ? session.accessTokenExpiresAt : null,
    useFakeTeslaApi,
    fakeScenarios: useFakeTeslaApi ? fakeListScenarios() : [],
  });
}
