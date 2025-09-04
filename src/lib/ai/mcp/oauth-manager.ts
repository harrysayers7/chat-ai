import "server-only";

import crypto from "crypto";
import { Redis } from "ioredis";
import globalLogger from "lib/logger";
import { colorize } from "consola/utils";
import {
  OAuthError,
  OAuthStateError,
  OAuthTokenError,
  OAuthRateLimitError,
  OAuthTimeoutError,
  OAuthConfigError,
  OAuthNetworkError,
  OAuthProviderError,
  OAuthSecurityError,
  OAuthErrorFactory,
  OAuthErrorHandler,
} from "./oauth-errors";

export interface OAuthFlowParams {
  state: string;
  codeChallenge: string;
  codeChallengeMethod: "S256";
}

export interface OAuthResult {
  userId: string;
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface OAuthStateData {
  userId: string;
  codeVerifier: string;
  mcpServerId: string;
  createdAt: number;
}

/**
 * OAuth Manager for secure state synchronization and PKCE implementation
 * Implements OAuth 2.0 security best practices with Redis-based state storage
 */
export class OAuthManager {
  private redis: Redis;
  private stateExpirySeconds = 300; // 5 minutes
  private maxRetries = 3;
  private retryDelayMs = 1000; // 1 second
  private requestTimeoutMs = 30000; // 30 seconds
  private logger = globalLogger.withDefaults({
    message: colorize("dim", "[OAuth Manager] "),
  });

  constructor(redisClient: Redis) {
    this.redis = redisClient;
  }

  /**
   * Generate a secure OAuth state using crypto.randomBytes
   * @returns A cryptographically secure 32-byte hex string
   */
  private generateSecureState(): string {
    return crypto.randomBytes(32).toString("hex");
  }

  /**
   * Generate a secure PKCE code verifier
   * @returns A base64url-encoded 32-byte random string
   */
  private generateCodeVerifier(): string {
    return crypto.randomBytes(32).toString("base64url");
  }

  /**
   * Generate PKCE code challenge from verifier using SHA-256
   * @param codeVerifier The code verifier
   * @returns The base64url-encoded SHA-256 hash
   */
  private generateCodeChallenge(codeVerifier: string): string {
    const hash = crypto.createHash("sha256").update(codeVerifier).digest();
    return hash.toString("base64url");
  }

  /**
   * Store OAuth state data in Redis with expiration
   * @param state The OAuth state
   * @param data The state data to store
   */
  private async storeStateData(
    state: string,
    data: OAuthStateData,
  ): Promise<void> {
    const stateKey = `oauth:state:${state}`;
    const stateData = JSON.stringify(data);

    await this.redis.setex(stateKey, this.stateExpirySeconds, stateData);
    this.logger.debug(
      `Stored OAuth state data for state: ${state.slice(0, 8)}...`,
    );
  }

  /**
   * Retrieve and consume OAuth state data from Redis
   * @param state The OAuth state
   * @returns The state data or null if not found/expired
   */
  private async consumeStateData(
    state: string,
  ): Promise<OAuthStateData | null> {
    const stateKey = `oauth:state:${state}`;

    // Use MULTI/EXEC for atomic get-and-delete operation
    const result = await this.redis.multi().get(stateKey).del(stateKey).exec();

    if (!result || !result[0] || !result[0][1]) {
      this.logger.warn(
        `OAuth state not found or expired: ${state.slice(0, 8)}...`,
      );
      return null;
    }

    try {
      const stateData = JSON.parse(result[0][1] as string) as OAuthStateData;
      this.logger.debug(
        `Retrieved OAuth state data for state: ${state.slice(0, 8)}...`,
      );
      return stateData;
    } catch (error) {
      this.logger.error(`Failed to parse OAuth state data: ${error}`);
      return null;
    }
  }

  /**
   * Initiate OAuth flow with secure state generation and PKCE
   * @param userId The user ID
   * @param mcpServerId The MCP server ID
   * @returns OAuth flow parameters including state and code challenge
   */
  async initiateOAuthFlow(
    userId: string,
    mcpServerId: string,
  ): Promise<OAuthFlowParams> {
    // Generate secure state and code verifier
    const state = this.generateSecureState();
    const codeVerifier = this.generateCodeVerifier();
    const codeChallenge = this.generateCodeChallenge(codeVerifier);

    // Store state data in Redis
    const stateData: OAuthStateData = {
      userId,
      codeVerifier,
      mcpServerId,
      createdAt: Date.now(),
    };

    await this.storeStateData(state, stateData);

    this.logger.info(
      `Initiated OAuth flow for user ${userId} with MCP server ${mcpServerId}`,
    );

    return {
      state,
      codeChallenge,
      codeChallengeMethod: "S256",
    };
  }

  /**
   * Validate OAuth callback and retrieve stored code verifier with timing-safe comparison
   * @param state The OAuth state from callback
   * @param mcpServerId The MCP server ID for validation
   * @returns The stored code verifier or null if invalid
   */
  async validateCallback(
    state: string,
    mcpServerId: string,
  ): Promise<string | null> {
    const stateData = await this.consumeStateData(state);

    if (!stateData) {
      this.logger.warn(
        `Invalid or expired OAuth state: ${state.slice(0, 8)}...`,
      );
      return null;
    }

    // Timing-safe comparison for MCP server ID
    const expectedServerId = stateData.mcpServerId;
    const receivedServerId = mcpServerId;

    if (!this.timingSafeEqual(expectedServerId, receivedServerId)) {
      this.logger.warn(
        `OAuth state MCP server ID mismatch. Expected: ${expectedServerId}, Got: ${receivedServerId}`,
      );
      return null;
    }

    // Check if state is expired (additional safety check)
    const now = Date.now();
    const stateAge = now - stateData.createdAt;
    if (stateAge > this.stateExpirySeconds * 1000) {
      this.logger.warn(
        `OAuth state expired. Age: ${stateAge}ms, Max: ${this.stateExpirySeconds * 1000}ms`,
      );
      return null;
    }

    this.logger.info(`Validated OAuth callback for user ${stateData.userId}`);
    return stateData.codeVerifier;
  }

  /**
   * Timing-safe string comparison to prevent timing attacks
   * @param a First string to compare
   * @param b Second string to compare
   * @returns True if strings are equal, false otherwise
   */
  private timingSafeEqual(a: string, b: string): boolean {
    try {
      return crypto.timingSafeEqual(
        Buffer.from(a, "utf8"),
        Buffer.from(b, "utf8"),
      );
    } catch (error) {
      this.logger.error(`Timing-safe comparison failed: ${error}`);
      return false;
    }
  }

  /**
   * Clean up expired OAuth states (maintenance method)
   * @returns Number of expired states cleaned up
   */
  async cleanupExpiredStates(): Promise<number> {
    const pattern = "oauth:state:*";
    const keys = await this.redis.keys(pattern);

    if (keys.length === 0) {
      return 0;
    }

    // Check TTL for each key and delete if expired
    const pipeline = this.redis.pipeline();
    let expiredCount = 0;

    for (const key of keys) {
      const ttl = await this.redis.ttl(key);
      if (ttl === -1) {
        // Key exists but has no expiration, delete it
        pipeline.del(key);
        expiredCount++;
      } else if (ttl === -2) {
        // Key doesn't exist, skip
        continue;
      }
    }

    if (expiredCount > 0) {
      await pipeline.exec();
      this.logger.info(`Cleaned up ${expiredCount} expired OAuth states`);
    }

    return expiredCount;
  }

  /**
   * Get Redis connection health status
   * @returns True if Redis is healthy, false otherwise
   */
  async isHealthy(): Promise<boolean> {
    try {
      await this.redis.ping();
      return true;
    } catch (error) {
      this.logger.error(`Redis health check failed: ${error}`);
      return false;
    }
  }

  /**
   * Validate state parameter format and security
   * @param state The OAuth state to validate
   * @returns True if state is valid, false otherwise
   */
  private isValidStateFormat(state: string): boolean {
    // State should be a 64-character hex string (32 bytes)
    const hexRegex = /^[a-f0-9]{64}$/i;
    return hexRegex.test(state);
  }

  /**
   * Enhanced state validation with additional security checks
   * @param state The OAuth state to validate
   * @param mcpServerId The MCP server ID for validation
   * @returns The stored code verifier or null if invalid
   */
  async validateCallbackEnhanced(
    state: string,
    mcpServerId: string,
  ): Promise<string | null> {
    // Validate state format first
    if (!this.isValidStateFormat(state)) {
      this.logger.warn(`Invalid OAuth state format: ${state.slice(0, 8)}...`);
      return null;
    }

    // Validate MCP server ID format (should be UUID)
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(mcpServerId)) {
      this.logger.warn(`Invalid MCP server ID format: ${mcpServerId}`);
      return null;
    }

    // Proceed with normal validation
    return await this.validateCallback(state, mcpServerId);
  }

  /**
   * Rate limiting for OAuth state validation attempts
   * @param identifier Client identifier (IP, user ID, etc.)
   * @param maxAttempts Maximum attempts per time window
   * @param timeWindowMs Time window in milliseconds
   * @returns True if within rate limit, false if rate limited
   */
  async checkRateLimit(
    identifier: string,
    maxAttempts: number = 10,
    timeWindowMs: number = 300000, // 5 minutes
  ): Promise<boolean> {
    const rateLimitKey = `oauth:ratelimit:${identifier}`;

    try {
      const current = await this.redis.incr(rateLimitKey);

      if (current === 1) {
        // Set expiration on first request
        await this.redis.expire(rateLimitKey, Math.floor(timeWindowMs / 1000));
      }

      if (current > maxAttempts) {
        this.logger.warn(`Rate limit exceeded for identifier: ${identifier}`);
        return false;
      }

      return true;
    } catch (error) {
      this.logger.error(`Rate limit check failed: ${error}`);
      // Allow request if rate limiting fails
      return true;
    }
  }

  /**
   * Complete OAuth flow with token exchange
   * @param state The OAuth state from callback
   * @param code The authorization code from callback
   * @param mcpServerId The MCP server ID
   * @param tokenEndpoint The OAuth provider's token endpoint
   * @param clientId The OAuth client ID
   * @param redirectUri The redirect URI used in the authorization request
   * @returns Complete OAuth result with tokens
   */
  async completeOAuthFlow(
    state: string,
    code: string,
    mcpServerId: string,
    tokenEndpoint: string,
    clientId: string,
    redirectUri: string,
  ): Promise<OAuthResult | null> {
    try {
      // Get state data first before consuming it
      const stateData = await this.consumeStateData(state);
      if (!stateData) {
        throw new OAuthStateError(
          `Invalid or expired OAuth state: ${state.slice(0, 8)}...`,
        );
      }

      // Validate MCP server ID with timing-safe comparison
      if (!this.timingSafeEqual(stateData.mcpServerId, mcpServerId)) {
        throw new OAuthSecurityError(
          `OAuth state MCP server ID mismatch. Expected: ${stateData.mcpServerId}, Got: ${mcpServerId}`,
        );
      }

      // Check if state is expired (additional safety check)
      const now = Date.now();
      const stateAge = now - stateData.createdAt;
      if (stateAge > this.stateExpirySeconds * 1000) {
        throw new OAuthTimeoutError(
          `OAuth state expired. Age: ${stateAge}ms, Max: ${this.stateExpirySeconds * 1000}ms`,
        );
      }

      // Exchange code for tokens using the code verifier
      const tokenResponse = await this.exchangeCodeForTokenWithRetry(
        code,
        stateData.codeVerifier,
        tokenEndpoint,
        clientId,
        redirectUri,
      );

      const oauthResult: OAuthResult = {
        userId: stateData.userId,
        accessToken: tokenResponse.accessToken,
        refreshToken: tokenResponse.refreshToken,
        expiresAt: Date.now() + tokenResponse.expiresIn * 1000,
      };

      this.logger.info(
        `OAuth flow completed successfully for user: ${oauthResult.userId}`,
      );
      return oauthResult;
    } catch (error) {
      const oauthError = OAuthErrorHandler.handle(error);
      this.logger.error(`OAuth flow completion failed: ${oauthError.message}`, {
        code: oauthError.code,
        isRetryable: oauthError.isRetryable,
        details: oauthError.details,
      });
      throw oauthError;
    }
  }

  /**
   * Exchange authorization code for tokens with retry logic
   * @param code The authorization code from OAuth callback
   * @param codeVerifier The PKCE code verifier
   * @param tokenEndpoint The OAuth provider's token endpoint
   * @param clientId The OAuth client ID
   * @param redirectUri The redirect URI used in the authorization request
   * @returns Token response with access and refresh tokens
   */
  private async exchangeCodeForTokenWithRetry(
    code: string,
    codeVerifier: string,
    tokenEndpoint: string,
    clientId: string,
    redirectUri: string,
  ): Promise<TokenResponse> {
    let lastError: OAuthError | null = null;

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        return await this.exchangeCodeForToken(
          code,
          codeVerifier,
          tokenEndpoint,
          clientId,
          redirectUri,
        );
      } catch (error) {
        lastError = OAuthErrorHandler.handle(error);

        // Don't retry non-retryable errors
        if (!lastError.isRetryable) {
          throw lastError;
        }

        // Don't retry on last attempt
        if (attempt === this.maxRetries) {
          throw lastError;
        }

        // Wait before retry with exponential backoff
        const delay = this.retryDelayMs * Math.pow(2, attempt - 1);
        this.logger.warn(
          `Token exchange attempt ${attempt} failed, retrying in ${delay}ms: ${lastError.message}`,
        );
        await this.sleep(delay);
      }
    }

    throw (
      lastError ||
      new OAuthTokenError("Token exchange failed after all retry attempts")
    );
  }

  /**
   * Sleep utility for retry delays
   * @param ms Milliseconds to sleep
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Enhanced token exchange with comprehensive error handling
   * @param code The authorization code from OAuth callback
   * @param codeVerifier The PKCE code verifier
   * @param tokenEndpoint The OAuth provider's token endpoint
   * @param clientId The OAuth client ID
   * @param redirectUri The redirect URI used in the authorization request
   * @returns Token response with access and refresh tokens
   */
  async exchangeCodeForToken(
    code: string,
    codeVerifier: string,
    tokenEndpoint: string,
    clientId: string,
    redirectUri: string,
  ): Promise<TokenResponse> {
    try {
      // Validate input parameters
      if (
        !code ||
        !codeVerifier ||
        !tokenEndpoint ||
        !clientId ||
        !redirectUri
      ) {
        throw new OAuthConfigError("Missing required OAuth parameters");
      }

      const tokenRequest = new URLSearchParams({
        grant_type: "authorization_code",
        code: code,
        redirect_uri: redirectUri,
        client_id: clientId,
        code_verifier: codeVerifier,
      });

      this.logger.debug(
        `Exchanging authorization code for tokens at: ${tokenEndpoint}`,
      );

      // Create AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(
        () => controller.abort(),
        this.requestTimeoutMs,
      );

      try {
        const response = await fetch(tokenEndpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Accept: "application/json",
            "User-Agent": "Better-Chatbot-OAuth/1.0",
          },
          body: tokenRequest.toString(),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorText = await response.text();
          let errorData: any = {};

          try {
            errorData = JSON.parse(errorText);
          } catch {
            // If not JSON, use the text as error description
            errorData = { error_description: errorText };
          }

          throw OAuthErrorFactory.createFromProviderError(
            errorData.error || "unknown_error",
            errorData.error_description || errorText,
            errorData.error_code,
          );
        }

        const tokenData = await response.json();

        // Validate token response
        if (!tokenData.access_token) {
          throw new OAuthTokenError(
            "Invalid token response: missing access_token",
          );
        }

        const tokenResponse: TokenResponse = {
          accessToken: tokenData.access_token,
          refreshToken: tokenData.refresh_token || "",
          expiresIn: tokenData.expires_in || 3600, // Default to 1 hour
        };

        this.logger.info(
          "Successfully exchanged authorization code for tokens",
        );
        return tokenResponse;
      } catch (error) {
        clearTimeout(timeoutId);

        if (error.name === "AbortError") {
          throw new OAuthTimeoutError(
            `Token exchange timeout after ${this.requestTimeoutMs}ms`,
          );
        }

        throw error;
      }
    } catch (error) {
      const oauthError = OAuthErrorHandler.handle(error);
      this.logger.error(`Token exchange error: ${oauthError.message}`, {
        code: oauthError.code,
        isRetryable: oauthError.isRetryable,
        details: oauthError.details,
      });
      throw oauthError;
    }
  }
}
