import "server-only";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { pgDb } from "lib/db/pg/db.pg";
import { headers } from "next/headers";
import { toast } from "sonner";
import { eq } from "drizzle-orm";
import {
  AccountSchema,
  SessionSchema,
  UserSchema,
  VerificationSchema,
} from "lib/db/pg/schema.pg";
import { getAuthConfig } from "./config";

import logger from "logger";
import { redirect } from "next/navigation";

const {
  emailAndPasswordEnabled,
  signUpEnabled,
  socialAuthenticationProviders,
} = getAuthConfig();

export const auth = betterAuth({
  plugins: [nextCookies()],
  baseURL: process.env.NEXT_PUBLIC_BASE_URL || "https://chat.sayers.app",
  trustedOrigins: [
    "https://chat.sayers.app",
    "http://localhost:3000",
    "http://localhost:3001",
  ],
  database: drizzleAdapter(pgDb, {
    provider: "pg",
    schema: {
      user: UserSchema,
      session: SessionSchema,
      account: AccountSchema,
      verification: VerificationSchema,
    },
  }),
  emailAndPassword: {
    enabled: emailAndPasswordEnabled,
    disableSignUp: !signUpEnabled,
  },
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 60 * 60,
    },
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day (every 1 day the session expiration is updated)
  },

  advanced: {
    useSecureCookies:
      process.env.NO_HTTPS == "1"
        ? false
        : process.env.NODE_ENV === "production",
    database: {
      generateId: false,
    },
  },
  account: {
    accountLinking: {
      trustedProviders: (
        Object.keys(
          socialAuthenticationProviders,
        ) as (keyof typeof socialAuthenticationProviders)[]
      ).filter((key) => socialAuthenticationProviders[key]),
    },
  },
  fetchOptions: {
    onError(e) {
      if (e.error.status === 429) {
        toast.error("Too many requests. Please try again later.");
      }
    },
  },
  socialProviders: socialAuthenticationProviders,
});

export const getSession = async () => {
  "use server";

  // Bypass authentication if DISABLE_AUTH is true
  if (process.env.DISABLE_AUTH === "true") {
    const defaultUserId = "550e8400-e29b-41d4-a716-446655440000"; // Valid UUID format

    try {
      // Check if default user exists, create if not
      const [existingUser] = await pgDb
        .select()
        .from(UserSchema)
        .where(eq(UserSchema.id, defaultUserId))
        .limit(1);

      if (!existingUser) {
        // Create default user in database
        await pgDb.insert(UserSchema).values({
          id: defaultUserId,
          name: "Development User",
          email: "dev@example.com",
          emailVerified: true,
          preferences: {},
        });
        console.log("Created default development user");
      }
    } catch (error) {
      console.error("Error creating default user:", error);
      // Continue anyway - the user creation might fail due to permissions
    }

    // Return a mock session for development
    return {
      user: {
        id: defaultUserId,
        email: "dev@example.com",
        name: "Development User",
        image: null,
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
    };
  }

  const session = await auth.api
    .getSession({
      headers: await headers(),
    })
    .catch((e) => {
      logger.error(e);
      return null;
    });
  if (!session) {
    logger.error("No session found");
    redirect("/sign-in");
  }
  return session!;
};
