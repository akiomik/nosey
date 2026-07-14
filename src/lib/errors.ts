export class HttpBadGatewayError extends Error {}

export class HttpBadRequestError extends Error {}

export class HttpTooManyRequestsError extends Error {
  constructor(
    message: string,
    public readonly retryAfterMs?: number
  ) {
    super(message);
  }
}
