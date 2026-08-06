import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  exchangeCodeForToken,
  resolveFleetApiBaseUrl,
  listVehicles,
} from "@/lib/tesla/client";
import { FLEET_API_REGIONS } from "@/lib/tesla/config";
import { getSession } from "@/lib/session/cookie";

export const runtime = "nodejs";

const STATE_COOKIE = "tescharge_oauth_state";

/**
 * TEMPORARY DIAGNOSTIC: client_credentials keeps failing with invalid_audience
 * for reasons we haven't pinned down, so try registering this app as a Fleet API
 * partner using the user's own OAuth access token instead, for both regions.
 * Safe to call repeatedly — Tesla's partner_accounts endpoint is idempotent for
 * an already-registered domain.
 */
async function tryRegisterPartnerAccount(
  accessToken: string,
  domain: string
): Promise<string> {
  const results: string[] = [];
  for (const [region, base] of Object.entries(FLEET_API_REGIONS)) {
    try {
      const res = await fetch(`${base}/api/1/partner_accounts`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ domain }),
      });
      results.push(`${region}:${res.status} ${await res.text()}`);
    } catch (e) {
      results.push(`${region}:threw ${e instanceof Error ? e.message : String(e)}`);
    }
  }
  return results.join(" | ");
}

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

  let partnerRegResult = "not attempted";

  try {
    const tokens = await exchangeCodeForToken(code, scenario);
    partnerRegResult = await tryRegisterPartnerAccount(
      tokens.access_token,
      request.nextUrl.hostname
    );
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
    url.searchParams.set("partnerReg", partnerRegResult);
    return NextResponse.redirect(url);
  }
}
