import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { buildAuthorizeUrl } from "@/lib/tesla/client";
import { useFakeTeslaApi } from "@/lib/tesla/config";

export const runtime = "nodejs";

const STATE_COOKIE = "tescharge_oauth_state";

export async function GET(request: NextRequest) {
  const state = crypto.randomUUID();
  const cookieStore = await cookies();
  cookieStore.set(STATE_COOKIE, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  });

  if (useFakeTeslaApi) {
    const scenario = request.nextUrl.searchParams.get("scenario") ?? "";
    const callbackUrl = new URL("/api/auth/callback", request.url);
    callbackUrl.searchParams.set("code", "fake-code");
    callbackUrl.searchParams.set("state", state);
    if (scenario) callbackUrl.searchParams.set("scenario", scenario);
    return NextResponse.redirect(callbackUrl);
  }

  return NextResponse.redirect(buildAuthorizeUrl(state));
}
