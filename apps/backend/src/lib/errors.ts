/**
 * ApiError — typed error with HTTP status code.
 * Thrown from route handlers, caught by the error-handler middleware.
 *
 * Error response shape (must match what api.ts on the frontend reads):
 *   { error: string }
 *
 * Note: the frontend reads `body.error` as a plain string — NOT { code, message }.
 */
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// ── Convenience factories ─────────────────────────────────────────────────────

export const Errors = {
  badRequest: (msg: string) => new ApiError(400, msg),
  unauthorized: (msg = 'Authentication required') => new ApiError(401, msg),
  forbidden: (msg = 'Forbidden') => new ApiError(403, msg),
  notFound: (msg = 'Not found') => new ApiError(404, msg),
  conflict: (msg: string) => new ApiError(409, msg),
  tooMany: (msg = 'Too many requests — please slow down') =>
    new ApiError(429, msg),
  internal: (msg = 'Internal server error') => new ApiError(500, msg),
} as const;
