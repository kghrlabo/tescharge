import { NextResponse } from "next/server";
import { getSession, getValidAccessToken } from "@/lib/session/cookie";
import { isConnected } from "@/lib/session/types";
import { ensureAwakeAndGetVehicleData } from "@/lib/tesla/client";
import { toChargeStatusPayload } from "@/lib/tesla/types";
import {
  TeslaAuthError,
  TeslaRateLimitError,
  VehicleAsleepError,
} from "@/lib/tesla/errors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();

  if (!isConnected(session)) {
    return NextResponse.json({ error: "not_connected" }, { status: 401 });
  }

  try {
    const accessToken = await getValidAccessToken(session);
    const data = await ensureAwakeAndGetVehicleData(
      accessToken,
      session.fleetApiBaseUrl!,
      session.vehicleId!
    );
    return NextResponse.json(toChargeStatusPayload(data));
  } catch (err) {
    if (err instanceof TeslaAuthError) {
      return NextResponse.json({ error: "auth_expired" }, { status: 401 });
    }
    if (err instanceof TeslaRateLimitError) {
      return NextResponse.json({ error: "rate_limited" }, { status: 429 });
    }
    if (err instanceof VehicleAsleepError) {
      return NextResponse.json({ error: "vehicle_unreachable" }, { status: 503 });
    }
    return NextResponse.json({ error: "tesla_api_error" }, { status: 502 });
  }
}
