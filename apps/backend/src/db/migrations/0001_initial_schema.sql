-- FormIQ v1.1 — Initial schema migration
-- Creates: users, sessions
-- Safe to re-run: uses IF NOT EXISTS throughout

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── Users ─────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "users" (
  "id"             UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  "email"          VARCHAR(255) NOT NULL UNIQUE,
  "password_hash"  TEXT,
  "name"           VARCHAR(255),
  "avatar_url"     TEXT,
  "company_name"   VARCHAR(255),
  "google_sub"     VARCHAR(255) UNIQUE,
  "email_verified" BOOLEAN NOT NULL DEFAULT false,
  "is_active"      BOOLEAN NOT NULL DEFAULT true,
  "is_super_admin" BOOLEAN NOT NULL DEFAULT false,
  "created_at"     TIMESTAMP NOT NULL DEFAULT NOW(),
  "updated_at"     TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "idx_users_email"      ON "users" ("email");
CREATE INDEX IF NOT EXISTS "idx_users_google_sub" ON "users" ("google_sub");

-- ── Sessions (refresh tokens) ─────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "sessions" (
  "id"                   UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  "user_id"              UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "refresh_token_hash"   TEXT NOT NULL,
  "user_agent"           TEXT,
  "ip_address"           VARCHAR(45),
  "expires_at"           TIMESTAMP NOT NULL,
  "revoked_at"           TIMESTAMP,
  "created_at"           TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "idx_sessions_user_id"            ON "sessions" ("user_id");
CREATE INDEX IF NOT EXISTS "idx_sessions_refresh_token_hash" ON "sessions" ("refresh_token_hash");
CREATE INDEX IF NOT EXISTS "idx_sessions_expires_at"         ON "sessions" ("expires_at");
