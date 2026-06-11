/**
 * Drizzle ORM schema — FormIQ v1.1
 * Tables: users, sessions
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
    passwordHash: text('password_hash'),
    name: varchar('name', { length: 255 }),
    avatarUrl: text('avatar_url'),
    companyName: varchar('company_name', { length: 255 }),
    googleSub: varchar('google_sub', { length: 255 }).unique(),
    emailVerified: boolean('email_verified').default(false).notNull(),
    isActive: boolean('is_active').default(true).notNull(),
    isSuperAdmin: boolean('is_super_admin').default(false).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    emailIdx: index('idx_users_email').on(table.email),
    googleSubIdx: index('idx_users_google_sub').on(table.googleSub),
  }),
);

// ── Sessions (refresh tokens) ─────────────────────────────────────────────────

export const sessions = pgTable(
  'sessions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    refreshTokenHash: text('refresh_token_hash').notNull(),
    userAgent: text('user_agent'),
    ipAddress: varchar('ip_address', { length: 45 }),
    expiresAt: timestamp('expires_at').notNull(),
    revokedAt: timestamp('revoked_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index('idx_sessions_user_id').on(table.userId),
    tokenHashIdx: index('idx_sessions_refresh_token_hash').on(table.refreshTokenHash),
    expiresAtIdx: index('idx_sessions_expires_at').on(table.expiresAt),
  }),
);

// ── Inferred types ────────────────────────────────────────────────────────────

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;
