export class TeslaApiError extends Error {
  status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = "TeslaApiError";
    this.status = status;
  }
}

/** Access token invalid/expired and refresh also failed — user must reconnect in Settings. */
export class TeslaAuthError extends TeslaApiError {
  constructor(message = "Tesla authentication expired") {
    super(message, 401);
    this.name = "TeslaAuthError";
  }
}

/** Tesla returned 429 — caller should back off / widen its polling interval. */
export class TeslaRateLimitError extends TeslaApiError {
  constructor(message = "Tesla API rate limit exceeded") {
    super(message, 429);
    this.name = "TeslaRateLimitError";
  }
}

/** Vehicle is asleep/offline (HTTP 408) — caller should wake_up and retry with backoff. */
export class VehicleAsleepError extends TeslaApiError {
  constructor(message = "Vehicle is asleep") {
    super(message, 408);
    this.name = "VehicleAsleepError";
  }
}
