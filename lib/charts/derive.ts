import type { LogPointDraft } from "../polling/chargeStateMachine";

export interface ChartRow {
  [key: string]: number;
  elapsedMinutes: number;
  soc: number;
  kw: number;
  current: number;
  voltage: number;
  kwh: number;
  minutesToFull: number;
}

export function toChartRows(logPoints: LogPointDraft[]): ChartRow[] {
  return logPoints.map((p) => ({
    elapsedMinutes: Math.round((p.elapsedSeconds / 60) * 10) / 10,
    soc: p.soc,
    kw: p.chargerPowerKw,
    current: p.chargerCurrentA,
    voltage: p.chargerVoltageV,
    kwh: p.energyAddedKwh,
    minutesToFull: p.minutesToFull,
  }));
}

export interface DSocRow {
  [key: string]: number;
  elapsedMinutes: number;
  dSocPerMin: number;
}

/** ΔSOC/Δ分 — a rough charging-efficiency-over-time signal. */
export function toDSocPerMinuteRows(logPoints: LogPointDraft[]): DSocRow[] {
  const rows: DSocRow[] = [];
  for (let i = 1; i < logPoints.length; i++) {
    const prev = logPoints[i - 1];
    const curr = logPoints[i];
    const dtMin = (curr.elapsedSeconds - prev.elapsedSeconds) / 60;
    if (dtMin <= 0) continue;
    const dSoc = curr.soc - prev.soc;
    rows.push({
      elapsedMinutes: Math.round((curr.elapsedSeconds / 60) * 10) / 10,
      dSocPerMin: Math.round((dSoc / dtMin) * 100) / 100,
    });
  }
  return rows;
}

export interface PowerVsSocRow {
  [key: string]: number;
  soc: number;
  kw: number;
}

export function toPowerVsSocRows(logPoints: LogPointDraft[]): PowerVsSocRow[] {
  return logPoints
    .filter((p) => p.chargerPowerKw > 0)
    .map((p) => ({ soc: p.soc, kw: p.chargerPowerKw }))
    .sort((a, b) => a.soc - b.soc);
}

export interface SocProjectionRow {
  timestamp: number;
  soc?: number;
  projectedSoc?: number;
}

export type SocProjectionMethod = "fitted" | "anchor" | "none";

export interface SocProjectionResult {
  rows: SocProjectionRow[];
  /**
   * "fitted" — curve shape comes from regressing the session's own telemetry.
   * "anchor" — not enough (post-warm-up) data yet, fell back to a generic
   * taper anchored on the vehicle's minutesToFull figure.
   * "none" — no forecast drawn (already ~full, or no ETA available).
   */
  method: SocProjectionMethod;
}

/** Cold-battery DC fast-charging without preconditioning ramps power up over
 * roughly this long as the pack warms; fitting through that window would read
 * the ramp-up as the steady-state taper and understate the eventual rate. */
const DC_NO_PRECON_WARMUP_SEC = 8 * 60;

interface LinearFit {
  slope: number;
  intercept: number;
  r2: number;
}

/** OLS fit of y = intercept + slope*x. */
function fitLinear(points: Array<{ x: number; y: number }>): LinearFit | null {
  const n = points.length;
  if (n < 2) return null;
  const meanX = points.reduce((s, p) => s + p.x, 0) / n;
  const meanY = points.reduce((s, p) => s + p.y, 0) / n;
  let num = 0;
  let den = 0;
  for (const p of points) {
    num += (p.x - meanX) * (p.y - meanY);
    den += (p.x - meanX) ** 2;
  }
  if (den === 0) return null;
  const slope = num / den;
  const intercept = meanY - slope * meanX;

  let ssRes = 0;
  let ssTot = 0;
  for (const p of points) {
    const yHat = intercept + slope * p.x;
    ssRes += (p.y - yHat) ** 2;
    ssTot += (p.y - meanY) ** 2;
  }
  const r2 = ssTot === 0 ? 1 : 1 - ssRes / ssTot;
  return { slope, intercept, r2 };
}

function buildAnchorCurve(
  latest: LogPointDraft,
  gap: number,
  minutesToFull: number
): SocProjectionRow[] {
  const totalMs = minutesToFull * 60_000;
  const residualFraction = Math.min(0.5, gap * 0.05) / gap;
  const k = -Math.log(residualFraction) / totalMs;

  const STEPS = 24;
  const projected: SocProjectionRow[] = [
    { timestamp: latest.timestamp, soc: latest.soc, projectedSoc: latest.soc },
  ];
  for (let i = 1; i <= STEPS; i++) {
    const t = (totalMs * i) / STEPS;
    projected.push({
      timestamp: latest.timestamp + t,
      projectedSoc: Math.round((100 - gap * Math.exp(-k * t)) * 10) / 10,
    });
  }
  return projected;
}

/**
 * Actual SOC-over-time plus a forecast curve out to the vehicle's own
 * minutes-to-full estimate — lets the user eyeball "what time will it hit 80%"
 * before the charge is done, e.g. to decide whether to stop early.
 *
 * The curve's shape is fit to the session's *own* telemetry whenever there's
 * enough of it: ln(100 - soc) is linear in time for an exponential taper, so
 * an ordinary least-squares fit of that transform recovers the real taper
 * rate directly from what's actually happened this session, re-fit on every
 * poll. Without preconditioning, DC fast charging ramps power up over the
 * first few minutes as the pack warms — fitting through that window would
 * mistake the ramp-up for the steady-state taper, so it's excluded and the
 * fit uses only data from after the pack has settled.
 *
 * Until there's enough post-warm-up data (e.g. right after plugging in), this
 * falls back to a generic exponential taper anchored on the vehicle's own
 * minutesToFull figure — a plausible sketch, not a fit to reality yet.
 */
export function toSocProjectionRows(
  logPoints: LogPointDraft[],
  minutesToFull: number,
  options: { precon: boolean; fastChargerPresent: boolean } = { precon: true, fastChargerPresent: false }
): SocProjectionResult {
  if (logPoints.length === 0) return { rows: [], method: "none" };
  const actual: SocProjectionRow[] = logPoints.map((p) => ({ timestamp: p.timestamp, soc: p.soc }));

  const latest = logPoints[logPoints.length - 1];
  const gap = 100 - latest.soc;
  if (minutesToFull <= 0 || gap <= 0.5) return { rows: actual, method: "none" };

  const warmupSec = options.fastChargerPresent && !options.precon ? DC_NO_PRECON_WARMUP_SEC : 0;
  const fitPoints = logPoints
    .filter((p) => p.soc < 99.5 && p.elapsedSeconds >= warmupSec)
    .map((p) => ({ x: p.elapsedSeconds / 60, y: Math.log(100 - p.soc) }));

  const fit = fitPoints.length >= 4 ? fitLinear(fitPoints) : null;
  const reliableFit = fit && fit.slope < -1e-4 && fit.r2 > 0.3 ? fit : null;

  if (!reliableFit) {
    return { rows: [...actual, ...buildAnchorCurve(latest, gap, minutesToFull)], method: "anchor" };
  }

  const latestElapsedMin = latest.elapsedSeconds / 60;
  // Re-anchor the fitted line to pass exactly through the latest actual point,
  // so the dashed forecast picks up right where the solid actual line ends.
  const adjustedIntercept = Math.log(gap) - reliableFit.slope * latestElapsedMin;

  const totalMinutes = minutesToFull;
  const STEPS = 24;
  const projected: SocProjectionRow[] = [
    { timestamp: latest.timestamp, soc: latest.soc, projectedSoc: latest.soc },
  ];
  for (let i = 1; i <= STEPS; i++) {
    const elapsedMin = latestElapsedMin + (totalMinutes * i) / STEPS;
    const soc = 100 - Math.exp(adjustedIntercept + reliableFit.slope * elapsedMin);
    projected.push({
      timestamp: latest.timestamp + (totalMinutes * i * 60_000) / STEPS,
      projectedSoc: Math.round(Math.min(100, Math.max(latest.soc, soc)) * 10) / 10,
    });
  }
  return { rows: [...actual, ...projected], method: "fitted" };
}
