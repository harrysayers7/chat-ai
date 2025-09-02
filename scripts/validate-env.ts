#!/usr/bin/env tsx

import { readFileSync, existsSync } from "fs";
import { join } from "path";

interface EnvValidationRule {
  key: string;
  required: boolean;
  type: "string" | "boolean" | "number" | "url" | "email";
  description: string;
  validator?: (value: string) => boolean;
}

const ENV_RULES: EnvValidationRule[] = [
  {
    key: "NODE_ENV",
    required: true,
    type: "string",
    description: "Node environment (development, staging, production)",
    validator: (value) =>
      ["development", "staging", "production"].includes(value),
  },
  {
    key: "NEXT_PUBLIC_BASE_URL",
    required: true,
    type: "url",
    description: "Public base URL for the application",
  },
  {
    key: "BETTER_AUTH_URL",
    required: true,
    type: "url",
    description: "Better Auth base URL",
  },
  {
    key: "BETTER_AUTH_SECRET",
    required: true,
    type: "string",
    description: "Better Auth secret key",
    validator: (value) => value.length >= 32,
  },
  {
    key: "POSTGRES_URL",
    required: true,
    type: "url",
    description: "PostgreSQL connection string",
  },
  {
    key: "OPENAI_API_KEY",
    required: false,
    type: "string",
    description: "OpenAI API key",
  },
  {
    key: "ANTHROPIC_API_KEY",
    required: false,
    type: "string",
    description: "Anthropic API key",
  },
  {
    key: "GOOGLE_GENERATIVE_AI_API_KEY",
    required: false,
    type: "string",
    description: "Google Generative AI API key",
  },
  {
    key: "XAI_API_KEY",
    required: false,
    type: "string",
    description: "XAI API key",
  },
  {
    key: "OPENROUTER_API_KEY",
    required: false,
    type: "string",
    description: "OpenRouter API key",
  },
  {
    key: "DISABLE_SIGN_UP",
    required: false,
    type: "boolean",
    description: "Disable user sign up",
  },
  {
    key: "DISABLE_EMAIL_SIGN_IN",
    required: false,
    type: "boolean",
    description: "Disable email sign in",
  },
  {
    key: "FILE_BASED_MCP_CONFIG",
    required: false,
    type: "boolean",
    description: "Enable file-based MCP configuration",
  },
];

function validateValue(value: string, rule: EnvValidationRule): boolean {
  if (!value && rule.required) {
    return false;
  }

  if (!value) {
    return true; // Optional values can be empty
  }

  switch (rule.type) {
    case "boolean":
      return ["true", "false", "1", "0", "yes", "no"].includes(
        value.toLowerCase(),
      );
    case "number":
      return !isNaN(Number(value));
    case "url":
      try {
        new URL(value);
        return true;
      } catch {
        return false;
      }
    case "email":
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    case "string":
      return rule.validator ? rule.validator(value) : true;
    default:
      return true;
  }
}

function parseEnvFile(filePath: string): Record<string, string> {
  if (!existsSync(filePath)) {
    throw new Error(`Environment file not found: ${filePath}`);
  }

  const content = readFileSync(filePath, "utf-8");
  const env: Record<string, string> = {};

  content.split("\n").forEach((line, index) => {
    const trimmedLine = line.trim();

    // Skip empty lines and comments
    if (!trimmedLine || trimmedLine.startsWith("#")) {
      return;
    }

    const equalIndex = trimmedLine.indexOf("=");
    if (equalIndex === -1) {
      console.warn(
        `⚠️  Invalid line ${index + 1} in ${filePath}: ${trimmedLine}`,
      );
      return;
    }

    const key = trimmedLine.substring(0, equalIndex).trim();
    const value = trimmedLine.substring(equalIndex + 1).trim();

    env[key] = value;
  });

  return env;
}

function validateEnvironment(
  env: Record<string, string>,
  environment: string,
): boolean {
  console.log(`🔍 Validating ${environment} environment configuration...\n`);

  let hasErrors = false;
  let hasWarnings = false;
  let _hasAtLeastOneLLMProvider = false;

  // Check required LLM providers
  const llmProviders = [
    "OPENAI_API_KEY",
    "ANTHROPIC_API_KEY",
    "GOOGLE_GENERATIVE_AI_API_KEY",
    "XAI_API_KEY",
    "OPENROUTER_API_KEY",
  ];
  const providedLLMProviders = llmProviders.filter(
    (key) =>
      env[key] &&
      env[key] !== "your-" + key.toLowerCase().replace(/_/g, "-") + "-here",
  );

  if (providedLLMProviders.length === 0) {
    console.error("❌ At least one LLM provider API key is required");
    hasErrors = true;
  } else {
    _hasAtLeastOneLLMProvider = true;
    console.log(
      `✅ LLM providers configured: ${providedLLMProviders.join(", ")}`,
    );
  }

  // Validate each rule
  ENV_RULES.forEach((rule) => {
    const value = env[rule.key];
    const isValid = validateValue(value, rule);

    if (
      rule.required &&
      (!value || (value.includes("your-") && value.includes("-here")))
    ) {
      console.error(`❌ Required: ${rule.key} - ${rule.description}`);
      hasErrors = true;
    } else if (rule.required && !isValid) {
      console.error(
        `❌ Invalid: ${rule.key} - ${rule.description} (value: ${value})`,
      );
      hasErrors = true;
    } else if (!rule.required && value && !isValid) {
      console.warn(
        `⚠️  Invalid: ${rule.key} - ${rule.description} (value: ${value})`,
      );
      hasWarnings = true;
    } else if (rule.required && isValid) {
      console.log(`✅ ${rule.key}: configured`);
    }
  });

  // Environment-specific validations
  if (environment === "production") {
    if (env.NODE_ENV !== "production") {
      console.error(
        '❌ NODE_ENV must be "production" for production deployment',
      );
      hasErrors = true;
    }

    if (
      env.NEXT_PUBLIC_BASE_URL &&
      !env.NEXT_PUBLIC_BASE_URL.startsWith("https://")
    ) {
      console.error("❌ NEXT_PUBLIC_BASE_URL must use HTTPS in production");
      hasErrors = true;
    }

    if (env.NO_HTTPS === "1") {
      console.warn("⚠️  NO_HTTPS=1 is not recommended for production");
      hasWarnings = true;
    }
  }

  if (environment === "staging") {
    if (env.NODE_ENV !== "staging") {
      console.warn('⚠️  NODE_ENV should be "staging" for staging deployment');
      hasWarnings = true;
    }
  }

  console.log("\n📊 Validation Summary:");
  console.log(`   Environment: ${environment}`);
  console.log(`   LLM Providers: ${providedLLMProviders.length}`);
  console.log(
    `   Required fields: ${ENV_RULES.filter((r) => r.required).length}`,
  );
  console.log(
    `   Configured fields: ${ENV_RULES.filter((r) => env[r.key] && !env[r.key].includes("your-")).length}`,
  );

  if (hasErrors) {
    console.log("\n❌ Validation failed with errors");
    return false;
  }

  if (hasWarnings) {
    console.log("\n⚠️  Validation passed with warnings");
  } else {
    console.log("\n✅ Validation passed successfully");
  }

  return true;
}

function main() {
  const args = process.argv.slice(2);
  const environment = args[0] || "staging";

  if (!["staging", "production"].includes(environment)) {
    console.error('❌ Invalid environment. Use "staging" or "production"');
    process.exit(1);
  }

  const envFile = `.env.${environment}`;

  try {
    const env = parseEnvFile(envFile);
    const isValid = validateEnvironment(env, environment);

    if (!isValid) {
      console.log("\n💡 To fix issues:");
      console.log(
        `   1. Copy scripts/env-templates/${environment}.env.example to ${envFile}`,
      );
      console.log("   2. Fill in your actual values");
      console.log("   3. Run this validation again");
      process.exit(1);
    }

    console.log(`\n🎉 ${environment} environment is ready for deployment!`);
  } catch (error) {
    console.error(
      `❌ Error: ${error instanceof Error ? error.message : error}`,
    );
    console.log("\n💡 To create environment file:");
    console.log(
      `   cp scripts/env-templates/${environment}.env.example ${envFile}`,
    );
    console.log("   # Then edit the file with your actual values");
    process.exit(1);
  }
}

// Check if this script is being run directly
if (process.argv[1] && process.argv[1].endsWith("validate-env.ts")) {
  main();
}

export { validateEnvironment, parseEnvFile, ENV_RULES };
