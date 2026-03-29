import { serve } from '@hono/node-server';
import app from './app';
import { env } from './config/env';
import { db } from './shared/db';
import { sql } from 'drizzle-orm';
import { readFileSync } from 'fs';

const port = env.PORT;

async function ensureDatabase() {
  console.log('🔄 Checking database connectivity...');
  try {
    const result = await db.execute(sql`SELECT 1 as ok`);
    console.log('✅ Database connected');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return false;
  }
}

async function runMigrations() {
  console.log('🔄 Running database migrations...');
  try {
    const migrationFiles = ['./drizzle/0000_lovely_leech.sql', './drizzle/0001_add_branding_subscriptions.sql'];
    const allStatements: string[] = [];
    for (const file of migrationFiles) {
      try {
        const content = readFileSync(file, 'utf-8');
        allStatements.push(...content.split('--> statement-breakpoint').map(s => s.trim()).filter(Boolean));
      } catch { /* file may not exist yet */ }
    }
    let applied = 0;
    let skipped = 0;
    for (const stmt of allStatements) {
      try {
        await db.execute(sql.raw(stmt));
        applied++;
      } catch (e: any) {
        if (['42P07', '42710', '42P16'].includes(e.code)) {
          skipped++;
        } else {
          console.error('⚠️  Migration statement error:', e.message);
        }
      }
    }
    console.log(`✅ Database migrations: ${applied} applied, ${skipped} already existed`);
  } catch (error) {
    console.error('⚠️  Migration runner error:', error);
  }
}

async function startServer() {
  console.log(`
╔══════════════════════════════════════════════╗
║          DocPix Studio API Server            ║
╠══════════════════════════════════════════════╣
║  Environment : ${env.NODE_ENV.padEnd(28)}║
║  Port        : ${String(port).padEnd(28)}║
║  URL         : ${`http://localhost:${port}`.padEnd(28)}║
╚══════════════════════════════════════════════╝
  `);

  const dbOk = await ensureDatabase();
  if (dbOk) {
    await runMigrations();
  }

  serve({
    fetch: app.fetch,
    port,
    hostname: '0.0.0.0',
  }, (info) => {
    console.log(`🚀 Server running on http://localhost:${info.port}`);
    console.log(`📋 Health check: http://localhost:${info.port}/health`);
    console.log(`🔐 Auth module:  http://localhost:${info.port}/auth`);
    console.log(`📄 Modules: auth, convert, esign, payments, admin, dashboard, org`);
  });
}

startServer();

// Graceful shutdown
const shutdown = () => {
  console.log('\n🛑 Shutting down gracefully...');
  process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
