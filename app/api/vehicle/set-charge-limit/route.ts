import { NextResponse } from "next/server";
import { getSession, getValidAccessToken } from "@/lib/session/cookie";
import { isConnected } from "@/lib/session/types";
import { setChargeLimit } from "@/lib/tesla/client";
import {
  TeslaAuthError,
  TeslaRateLimitError,
  VehicleAsleepError,
} from "@/lib/tesla/errors";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const session = await getSession();

  if (!isConnected(session)) {
    return NextResponse.json({ error: "not_connected" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const percent = body?.percent;
  if (typeof percent !== "number" || percent < 50 || percent > 100) {
    return NextResponse.json({ error: "invalid_percent" }, { status: 400 });
  }

  try {
    const accessToken = await getValidAccessToken(session);
    await setChargeLimit(accessToken, session.fleetApiBaseUrl!, session.vehicleId!, percent);
    return NextResponse.json({ ok: true });
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
