/**
 * Drizzle ORM schema — FormIQ v1.1
 * Tables: users, sessions
 *
 * Design notes:
 * - Refresh tokens are stored HASHED (SHA-256), not raw, for defence-in-depth
 * - googleSub stores the Google "sub" claim (stable user ID) not googleId
 * - sessions.revokedAt tracks explicit logouts; expired sessions are also invalid
 */
import {
  pgTable,
  text,
  timestamp,
  boolean,
  uuid,
  varchar,
  index,
} from 'drizzle-orm/pg-core';

// ── Users ─────────────────────────────────────────────────────────────────────

export const users = pgTable(
  'users',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    email: varchar('email', { length: 255 }).notNull().unique(),
    passwordHash: text('password_hash'),          // null for Google-only users
    name: varchar('name', { length: 255 }),
    avatarUrl: text('avatar_url'),
    companyName: varchar('company_name', { length: 255 }),
    googleSub: varchar('google_sub', { length: 255 }).unique(), // Google "sub" claim
    emailVerified: boolean('email_verified').default(false).notNull(),
    isActive: boolean('is_active').default(true).notNull(),
    isSuperAdmin: boolean('is_super_admin').default(false).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [
    index('idx_users_email').on(table.email),
    index('idx_users_google_sub').on(table.googleSub),
  ],
);

// ── Sessions (refresh tokens) ─────────────────────────────────────────────────

export const sessions = pgTable(
  'sessions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    /** SHA-256 hash of the raw refresh token sent to the client */
    refreshTokenHash: text('refresh_token_hash').notNull(),
    userAgent: text('user_agent'),
    ipAddress: varchar('ip_address', { length: 45 }),
    expiresAt: timestamp('expires_at').notNull(),
    revokedAt: timestamp('revoked_at'),           // set on logout or token rotation
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    index('idx_sessions_user_id').on(table.userId),
    index('idx_sessions_refresh_token_hash').on(table.refreshTokenHash),
    index('idx_sessions_expires_at').on(table.expiresAt),
  ],
);

// ── Inferred types ────────────────────────────────────────────────────────────

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;
