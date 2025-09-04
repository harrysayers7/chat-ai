import "server-only";

/**
 * Base OAuth error class
 */
export abstract class OAuthError extends Error {
  abstract readonly code: string;
  abstract readonly statusCode: number;
  abstract readonly isRetryable: boolean;

  constructor(
    message: string,
    public readonly details?: Record<string, any>,
  ) {
    super(message);
    this.name = this.constructor.name;
  }
}

/**
 * OAuth state validation error
 */
export class OAuthStateError extends OAuthError {
  readonly code = "invalid_state";
  readonly statusCode = 400;
  readonly isRetryable = false;

  constructor(
    message: string = "Invalid or expired OAuth state",
    details?: Record<string, any>,
  ) {
    super(message, details);
  }
}

/**
 * OAuth PKCE validation error
 */
export class OAuthPKCEError extends OAuthError {
  readonly code = "invalid_pkce";
  readonly statusCode = 400;
  readonly isRetryable = false;

  constructor(
    message: string = "Invalid PKCE parameters",
    details?: Record<string, any>,
  ) {
    super(message, details);
  }
}

/**
 * OAuth token exchange error
 */
export class OAuthTokenError extends OAuthError {
  readonly code = "token_exchange_failed";
  readonly statusCode = 400;
  readonly isRetryable = true;

  constructor(
    message: string = "Token exchange failed",
    details?: Record<string, any>,
  ) {
    super(message, details);
  }
}

/**
 * OAuth rate limit error
 */
export class OAuthRateLimitError extends OAuthError {
  readonly code = "rate_limited";
  readonly statusCode = 429;
  readonly isRetryable = true;

  constructor(
    message: string = "Rate limit exceeded",
    details?: Record<string, any>,
  ) {
    super(message, details);
  }
}

/**
 * OAuth timeout error
 */
export class OAuthTimeoutError extends OAuthError {
  readonly code = "timeout";
  readonly statusCode = 408;
  readonly isRetryable = true;

  constructor(
    message: string = "OAuth flow timeout",
    details?: Record<string, any>,
  ) {
    super(message, details);
  }
}

/**
 * OAuth configuration error
 */
export class OAuthConfigError extends OAuthError {
  readonly code = "invalid_config";
  readonly statusCode = 500;
  readonly isRetryable = false;

  constructor(
    message: string = "OAuth configuration error",
    details?: Record<string, any>,
  ) {
    super(message, details);
  }
}

/**
 * OAuth network error
 */
export class OAuthNetworkError extends OAuthError {
  readonly code = "network_error";
  readonly statusCode = 502;
  readonly isRetryable = true;

  constructor(
    message: string = "Network error during OAuth flow",
    details?: Record<string, any>,
  ) {
    super(message, details);
  }
}

/**
 * OAuth provider error
 */
export class OAuthProviderError extends OAuthError {
  readonly code = "provider_error";
  readonly statusCode = 502;
  readonly isRetryable = true;

  constructor(
    message: string = "OAuth provider error",
    public readonly providerCode?: string,
    details?: Record<string, any>,
  ) {
    super(message, details);
  }
}

/**
 * OAuth security error
 */
export class OAuthSecurityError extends OAuthError {
  readonly code = "security_error";
  readonly statusCode = 403;
  readonly isRetryable = false;

  constructor(
    message: string = "OAuth security violation",
    details?: Record<string, any>,
  ) {
    super(message, details);
  }
}

/**
 * OAuth error factory for creating appropriate error types
 */
export class OAuthErrorFactory {
  static createFromProviderError(
    error: string,
    description?: string,
    providerCode?: string,
  ): OAuthError {
    const details = { providerCode, description };

    switch (error) {
      case "invalid_grant":
        return new OAuthTokenError(
          "Invalid authorization code or code verifier",
          details,
        );
      case "invalid_client":
        return new OAuthConfigError(
          "Invalid OAuth client configuration",
          details,
        );
      case "invalid_request":
        return new OAuthTokenError("Invalid token request parameters", details);
      case "unauthorized_client":
        return new OAuthConfigError(
          "Client not authorized for this grant type",
          details,
        );
      case "unsupported_grant_type":
        return new OAuthConfigError("Unsupported grant type", details);
      case "invalid_scope":
        return new OAuthConfigError("Invalid or insufficient scope", details);
      case "server_error":
        return new OAuthProviderError(
          "OAuth provider server error",
          providerCode,
          details,
        );
      case "temporarily_unavailable":
        return new OAuthProviderError(
          "OAuth provider temporarily unavailable",
          providerCode,
          details,
        );
      default:
        return new OAuthProviderError(
          description || "Unknown OAuth provider error",
          providerCode,
          details,
        );
    }
  }

  static createFromNetworkError(error: Error): OAuthError {
    if (error.name === "TimeoutError" || error.message.includes("timeout")) {
      return new OAuthTimeoutError("OAuth request timeout", {
        originalError: error.message,
      });
    }

    if (
      error.message.includes("ECONNREFUSED") ||
      error.message.includes("ENOTFOUND")
    ) {
      return new OAuthNetworkError("OAuth provider unreachable", {
        originalError: error.message,
      });
    }

    return new OAuthNetworkError("Network error during OAuth request", {
      originalError: error.message,
    });
  }

  static createFromValidationError(field: string, value: any): OAuthError {
    switch (field) {
      case "state":
        return new OAuthStateError(`Invalid state format: ${value}`, {
          field,
          value,
        });
      case "code_verifier":
        return new OAuthPKCEError(`Invalid code verifier format: ${value}`, {
          field,
          value,
        });
      case "mcpServerId":
        return new OAuthSecurityError(
          `Invalid MCP server ID format: ${value}`,
          { field, value },
        );
      default:
        return new OAuthSecurityError(`Invalid ${field}: ${value}`, {
          field,
          value,
        });
    }
  }
}

/**
 * OAuth error handler for consistent error responses
 */
export class OAuthErrorHandler {
  static handle(error: unknown): OAuthError {
    if (error instanceof OAuthError) {
      return error;
    }

    if (error instanceof Error) {
      return OAuthErrorFactory.createFromNetworkError(error);
    }

    return new OAuthError("Unknown OAuth error", { originalError: error });
  }

  static toResponse(error: OAuthError): {
    error: string;
    error_description: string;
    statusCode: number;
    isRetryable: boolean;
  } {
    return {
      error: error.code,
      error_description: error.message,
      statusCode: error.statusCode,
      isRetryable: error.isRetryable,
    };
  }
}
