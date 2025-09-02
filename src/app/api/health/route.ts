import { NextResponse } from "next/server";
import { pgDb } from "lib/db/pg/db.pg";

export async function GET() {
  try {
    // Basic health check
    const health: any = {
      status: "healthy",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV,
      version: process.env.npm_package_version || "1.0.0",
    };

    // Check database connectivity
    try {
      await pgDb.execute("SELECT 1");
      health.database = "connected";
    } catch (_error) {
      health.database = "disconnected";
      health.status = "unhealthy";
    }

    // Check environment variables
    const requiredEnvVars = ["BETTER_AUTH_SECRET", "POSTGRES_URL"];

    const missingEnvVars = requiredEnvVars.filter(
      (envVar) => !process.env[envVar],
    );

    if (missingEnvVars.length > 0) {
      health.missingEnvVars = missingEnvVars;
      health.status = "unhealthy";
    }

    // Check LLM providers
    const llmProviders = [
      "OPENAI_API_KEY",
      "ANTHROPIC_API_KEY",
      "GOOGLE_GENERATIVE_AI_API_KEY",
      "XAI_API_KEY",
      "OPENROUTER_API_KEY",
    ];

    const configuredProviders = llmProviders.filter(
      (provider) => process.env[provider],
    );

    health.llmProviders = {
      configured: configuredProviders.length,
      total: llmProviders.length,
      providers: configuredProviders,
    };

    if (configuredProviders.length === 0) {
      health.status = "unhealthy";
    }

    // Return appropriate status code
    const statusCode = health.status === "healthy" ? 200 : 503;

    return NextResponse.json(health, { status: statusCode });
  } catch (error) {
    return NextResponse.json(
      {
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 503 },
    );
  }
}
