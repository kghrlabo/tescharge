import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  exchangeCodeForToken,
  resolveFleetApiBaseUrl,
  listVehicles,
} from "@/lib/tesla/client";
import { getSession } from "@/lib/session/cookie";

export const runtime = "nodejs";

const STATE_COOKIE = "tescharge_oauth_state";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const scenario = searchParams.get("scenario") ?? undefined;

  const cookieStore = await cookies();
  const expectedState = cookieStore.get(STATE_COOKIE)?.value;
  cookieStore.delete(STATE_COOKIE);

  if (!code || !state || !expectedState || state !== expectedState) {
    return NextResponse.redirect(
      new URL("/settings?error=invalid_oauth_state", request.url)
    );
  }

  try {
    const tokens = await exchangeCodeForToken(code, scenario);
    const fleetApiBaseUrl = await resolveFleetApiBaseUrl(tokens.access_token);
    const vehicles = await listVehicles(tokens.access_token, fleetApiBaseUrl);
    const vehicle = vehicles[0];

    if (!vehicle) {
      return NextResponse.redirect(
        new URL("/settings?error=no_vehicle_found", request.url)
      );
    }

    const session = await getSession();
    session.accessToken = tokens.access_token;
    session.refreshToken = tokens.refresh_token;
    session.accessTokenExpiresAt = Date.now() + tokens.expires_in * 1000;
    session.fleetApiBaseUrl = fleetApiBaseUrl;
    session.vehicleId = vehicle.id;
    session.vin = vehicle.vin;
    session.vehicleDisplayName = vehicle.display_name;
    await session.save();

    return NextResponse.redirect(new URL("/settings?connected=1", request.url));
  } catch (err) {
    // Temporary diagnostic detail — surfaced in the URL so it's visible without
    // paid Vercel log access. Safe to include: never touches tokens/secrets,
    // only the thrown error's own message/status.
    const detail =
      err instanceof Error
        ? `${err.name}: ${err.message}`
        : "unknown error";
    const url = new URL("/settings", request.url);
    url.searchParams.set("error", "tesla_connect_failed");
    url.searchParams.set("detail", detail);
    return NextResponse.redirect(url);
  }
}
