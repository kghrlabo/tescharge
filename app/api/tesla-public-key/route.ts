// Served at /.well-known/appspecific/com.tesla.3p.public-key.pem via the rewrite
// in next.config.ts — Vercel's static-asset CDN silently 404s on dot-prefixed path
// segments under public/, so this must go through an actual route handler instead.
const PUBLIC_KEY = `-----BEGIN PUBLIC KEY-----
MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEM9jdGtgWv3I3c1FmQLLZZ27k/88p
a3lmyKMggE5fvyp9H7L+2V4vC1lEM8s4GQnf+mXUaZujavDheyxFMikLbQ==
-----END PUBLIC KEY-----
`;

export const dynamic = "force-static";

export function GET() {
  return new Response(PUBLIC_KEY, {
    headers: { "Content-Type": "text/plain" },
  });
}
