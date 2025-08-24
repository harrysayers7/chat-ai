-- Migration: Add Prompt Library Tables
-- Created: 2025-08-23

-- Create prompt table
CREATE TABLE IF NOT EXISTS "prompt" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" text NOT NULL,
  "content" text NOT NULL,
  "description" text,
  "category" text,
  "tags" json DEFAULT '[]',
  "is_public" boolean NOT NULL DEFAULT false,
  "user_id" uuid NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "usage_count" integer NOT NULL DEFAULT 0,
  "created_at" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create prompt_category table
CREATE TABLE IF NOT EXISTS "prompt_category" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" text NOT NULL,
  "color" text,
  "user_id" uuid NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "created_at" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS "prompt_user_id_idx" ON "prompt"("user_id");
CREATE INDEX IF NOT EXISTS "prompt_category_idx" ON "prompt"("category");
CREATE INDEX IF NOT EXISTS "prompt_tags_idx" ON "prompt" USING GIN("tags");
CREATE INDEX IF NOT EXISTS "prompt_public_idx" ON "prompt"("is_public");
CREATE INDEX IF NOT EXISTS "prompt_category_user_id_idx" ON "prompt_category"("user_id");

-- Insert some default categories
INSERT INTO "prompt_category" ("name", "color", "user_id") VALUES
  ('Development', '#3b82f6', (SELECT "id" FROM "user" LIMIT 1)),
  ('Communication', '#10b981', (SELECT "id" FROM "user" LIMIT 1)),
  ('Analysis', '#f59e0b', (SELECT "id" FROM "user" LIMIT 1)),
  ('Creative', '#8b5cf6', (SELECT "id" FROM "user" LIMIT 1)),
  ('Business', '#ef4444', (SELECT "id" FROM "user" LIMIT 1))
ON CONFLICT DO NOTHING;

-- Insert some sample prompts
INSERT INTO "prompt" ("name", "content", "description", "category", "tags", "is_public", "user_id") VALUES
  (
    'Code Review',
    'Please review this code for security issues, performance improvements, and best practices:',
    'Standard code review prompt for development teams',
    'Development',
    '["code", "review", "security", "performance"]',
    true,
    (SELECT "id" FROM "user" LIMIT 1)
  ),
  (
    'Email Writer',
    'Help me write a professional email about:',
    'Professional email assistance for business communication',
    'Communication',
    '["email", "professional", "business"]',
    true,
    (SELECT "id" FROM "user" LIMIT 1)
  ),
  (
    'Data Analysis',
    'Analyze this data and provide insights on:',
    'Data analysis and insights generation',
    'Analysis',
    '["data", "analysis", "insights"]',
    true,
    (SELECT "id" FROM "user" LIMIT 1)
  )
ON CONFLICT DO NOTHING;

