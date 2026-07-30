import { cookies } from "next/headers";
import { getIronSession, type IronSession, type SessionOptions } from "iron-session";
import type { SessionData } from "./types";
import { refreshAccessToken } from "../tesla/client";

const DEV_FALLBACK_PASSWORD = "dev-only-insecure-password-change-me-32ch";

const password = process.env.IRON_SESSION_PASSWORD;

if (!password && process.env.NODE_ENV === "production") {
  throw new Error(
    "IRON_SESSION_PASSWORD must be set (32+ characters) in production."
  );
}

export const sessionOptions: SessionOptions = {
  password: password ?? DEV_FALLBACK_PASSWORD,
  cookieName: "tescharge_session",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "lax",
  },
};

/** Route Handlers and Server Components only — never expose tokens to the browser. */
export async function getSession(): Promise<IronSession<SessionData>> {
  const cookieStore = await cookies();
  return getIronSession<SessionData>(cookieStore, sessionOptions);
}

/**
 * Returns a currently-valid access token, transparently refreshing (and persisting the
 * rotated refresh token) if it's within 60s of expiry. Throws if not connected.
 */
export async function getValidAccessToken(
  session: IronSession<SessionData>
): Promise<string> {
  if (!session.accessToken || !session.refreshToken || !session.accessTokenExpiresAt) {
    throw new Error("Not connected to Tesla");
  }

  const isNearExpiry = Date.now() > session.accessTokenExpiresAt - 60_000;
  if (!isNearExpiry) {
    return session.accessToken;
  }

  const tokens = await refreshAccessToken(session.refreshToken);
  session.accessToken = tokens.access_token;
  // Tesla rotates the refresh token on every refresh — persist the new one every time.
  session.refreshToken = tokens.refresh_token;
  session.accessTokenExpiresAt = Date.now() + tokens.expires_in * 1000;
  await session.save();
  return session.accessToken;
}
