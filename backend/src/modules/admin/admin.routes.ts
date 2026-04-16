import { Hono } from 'hono';
import { requireAuth, getUser } from '../../shared/middleware/auth';
import { requireSuperAdmin } from '../../shared/middleware/admin.middleware';
import { db } from '../../shared/db';
import { users, documents, payments, auditLog, signatureRequests, organizations, feedback, orgMembers, platformSettings } from '../../shared/db/schema';
import { eq, sql, desc, ilike, and, gte, lte, count } from 'drizzle-orm';

const admin = new Hono();

// All admin routes require authentication + super admin
admin.use('/*', requireAuth, requireSuperAdmin);

// ── Dashboard Stats ──
admin.get('/dashboard/stats', async (c) => {
  try {
    const [userStats] = await db.select({
      total: count(),
      verified: sql<number>`count(*) filter (where ${users.emailVerified} = true)`,
      active: sql<number>`count(*) filter (where ${users.isActive} = true)`,
      newToday: sql<number>`count(*) filter (where ${users.createdAt} >= current_date)`,
      newThisWeek: sql<number>`count(*) filter (where ${users.createdAt} >= current_date - interval '7 days')`,
    }).from(users);

    const [docStats] = await db.select({
      total: count(),
      signed: sql<number>`count(*) filter (where ${documents.status} = 'signed' or ${documents.status} = 'completed')`,
      pending: sql<number>`count(*) filter (where ${documents.status} = 'sent' or ${documents.status} = 'viewed')`,
    }).from(documents);

    const [revenueStats] = await db.select({
      total: sql<number>`coalesce(sum(${payments.amount}), 0)`,
      thisMonth: sql<number>`coalesce(sum(${payments.amount}) filter (where ${payments.createdAt} >= date_trunc('month', current_date)), 0)`,
      successRate: sql<number>`case when count(*) > 0 then round(count(*) filter (where ${payments.status} = 'paid')::numeric / count(*)::numeric * 100, 1) else 0 end`,
    }).from(payments);

    const [orgStats] = await db.select({
      total: count(),
      active: sql<number>`count(*) filter (where ${organizations.isActive} = true)`,
    }).from(organizations);

    return c.json({
      data: {
        totalUsers: userStats.total,
        verifiedUsers: userStats.verified,
        activeUsers: userStats.active,
        newUsersToday: userStats.newToday,
        newUsersThisWeek: userStats.newThisWeek,
        totalDocuments: docStats.total,
        documentsSigned: docStats.signed,
        documentsPending: docStats.pending,
        signatureCompletionRate: docStats.total > 0
          ? Math.round((docStats.signed / docStats.total) * 100)
          : 0,
        totalRevenue: revenueStats.total,
        revenueThisMonth: revenueStats.thisMonth,
        paymentSuccessRate: revenueStats.successRate,
        totalOrganizations: orgStats.total,
        activeOrganizations: orgStats.active,
      }
    });
  } catch (err: any) {
    console.error('[admin] Dashboard stats error:', err.message);
    return c.json({ error: 'Failed to fetch dashboard stats' }, 500);
  }
});

// ── Users List ──
admin.get('/users', async (c) => {
  const page = parseInt(c.req.query('page') || '1');
  const limit = parseInt(c.req.query('limit') || '25');
  const search = c.req.query('search');
  const offset = (page - 1) * limit;

  try {
    const conditions = search
      ? ilike(users.email, `%${search}%`)
      : undefined;

    const [{ total }] = await db
      .select({ total: count() })
      .from(users)
      .where(conditions);

    const rows = await db
      .select()
      .from(users)
      .where(conditions)
      .orderBy(desc(users.createdAt))
      .limit(limit)
      .offset(offset);

    return c.json({
      data: rows,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (err: any) {
    console.error('[admin] Users list error:', err.message);
    return c.json({ error: 'Failed to fetch users' }, 500);
  }
});

// ── User Detail ──
admin.get('/users/:id', async (c) => {
  const userId = c.req.param('id');
  try {
    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!user) return c.json({ error: 'User not found' }, 404);
    return c.json({ data: user });
  } catch (err: any) {
    return c.json({ error: 'Failed to fetch user' }, 500);
  }
});

// ── Update User (active/plan/superadmin) ──
admin.patch('/users/:id', async (c) => {
  const userId = c.req.param('id');
  const body = await c.req.json();
  try {
    const [updated] = await db
      .update(users)
      .set({
        isActive: body.isActive ?? undefined,
        plan: body.plan ?? undefined,
        isSuperAdmin: body.isSuperAdmin ?? undefined,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();
    return c.json({ data: updated });
  } catch (err: any) {
    console.error('[admin] Update user error:', err.message);
    return c.json({ error: 'Failed to update user' }, 500);
  }
});

// ── Audit Log ──
admin.get('/audit-log', async (c) => {
  const page = parseInt(c.req.query('page') || '1');
  const limit = parseInt(c.req.query('limit') || '50');
  const action = c.req.query('action');
  const offset = (page - 1) * limit;

  try {
    const conditions = action ? eq(auditLog.action, action) : undefined;

    const [{ total }] = await db.select({ total: count() }).from(auditLog).where(conditions);
    const rows = await db
      .select()
      .from(auditLog)
      .where(conditions)
      .orderBy(desc(auditLog.createdAt))
      .limit(limit)
      .offset(offset);

    return c.json({
      data: rows,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (err: any) {
    return c.json({ error: 'Failed to fetch audit log' }, 500);
  }
});

// ── Revenue ──
admin.get('/revenue', async (c) => {
  try {
    const rows = await db
      .select({
        date: sql<string>`date_trunc('day', ${payments.createdAt})::date`,
        total: sql<number>`sum(${payments.amount})`,
        count: count(),
      })
      .from(payments)
      .where(eq(payments.status, 'paid'))
      .groupBy(sql`date_trunc('day', ${payments.createdAt})::date`)
      .orderBy(sql`date_trunc('day', ${payments.createdAt})::date`);

    return c.json({ data: rows });
  } catch (err: any) {
    return c.json({ error: 'Failed to fetch revenue data' }, 500);
  }
});

// ── Organizations ──
admin.get('/organizations', async (c) => {
  const page = parseInt(c.req.query('page') || '1');
  const limit = parseInt(c.req.query('limit') || '25');
  const offset = (page - 1) * limit;

  try {
    const [{ total }] = await db.select({ total: count() }).from(organizations);
    const rows = await db
      .select()
      .from(organizations)
      .orderBy(desc(organizations.createdAt))
      .limit(limit)
      .offset(offset);

    return c.json({
      data: rows,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (err: any) {
    return c.json({ error: 'Failed to fetch organizations' }, 500);
  }
});

// ── Documents List ──
admin.get('/documents', async (c) => {
  const page = parseInt(c.req.query('page') || '1');
  const limit = parseInt(c.req.query('limit') || '25');
  const status = c.req.query('status');
  const offset = (page - 1) * limit;

  try {
    const conditions = status ? eq(documents.status, status) : undefined;

    const [{ total }] = await db.select({ total: count() }).from(documents).where(conditions);
    const rows = await db
      .select()
      .from(documents)
      .where(conditions)
      .orderBy(desc(documents.createdAt))
      .limit(limit)
      .offset(offset);

    return c.json({
      data: rows,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (err: any) {
    console.error('[admin] List documents error:', err.message);
    return c.json({ error: 'Failed to fetch documents' }, 500);
  }
});

// ── Feedback ──
admin.get('/feedback', async (c) => {
  const page = parseInt(c.req.query('page') || '1');
  const limit = parseInt(c.req.query('limit') || '25');
  const priority = c.req.query('priority');
  const offset = (page - 1) * limit;

  try {
    const conditions = priority ? eq(feedback.priority, priority) : undefined;

    const [{ total }] = await db.select({ total: count() }).from(feedback).where(conditions);
    const rows = await db
      .select()
      .from(feedback)
      .where(conditions)
      .orderBy(desc(feedback.createdAt))
      .limit(limit)
      .offset(offset);

    return c.json({
      data: rows,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (err: any) {
    console.error('[admin] List feedback error:', err.message);
    return c.json({ error: 'Failed to fetch feedback' }, 500);
  }
});

// ── Update Feedback Status/Priority ──
admin.patch('/feedback/:id', async (c) => {
  const feedbackId = c.req.param('id');
  const body = await c.req.json();

  if (!body.status && !body.priority) {
    return c.json({ error: 'Must provide status or priority' }, 400);
  }

  try {
    const [updated] = await db
      .update(feedback)
      .set({
        status: body.status ?? undefined,
        priority: body.priority ?? undefined,
      })
      .where(eq(feedback.id, feedbackId))
      .returning();

    if (!updated) {
      return c.json({ error: 'Feedback not found' }, 404);
    }

    return c.json({ data: updated });
  } catch (err: any) {
    console.error('[admin] Update feedback error:', err.message);
    return c.json({ error: 'Failed to update feedback' }, 500);
  }
});

// ── Create Organization (admin override) ──
admin.post('/organizations', async (c) => {
  const body = await c.req.json();

  if (!body.name || !body.slug || !body.ownerId) {
    return c.json({ error: 'Name, slug, and ownerId are required' }, 400);
  }

  // Validate slug format
  if (!/^[a-z0-9-]+$/.test(body.slug)) {
    return c.json({ error: 'Slug must be lowercase alphanumeric with hyphens only' }, 400);
  }

  try {
    // Verify owner exists
    const [ownerUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, body.ownerId))
      .limit(1);

    if (!ownerUser) {
      return c.json({ error: 'Owner user not found' }, 404);
    }

    const [newOrg] = await db
      .insert(organizations)
      .values({
        name: body.name,
        slug: body.slug,
        ownerId: body.ownerId,
        plan: body.plan || 'free',
      })
      .returning();

    // Add owner as organization member
    await db.insert(orgMembers).values({
      orgId: newOrg.id,
      userId: body.ownerId,
      role: 'owner',
      joinedAt: new Date(),
    });

    return c.json({ data: newOrg }, 201);
  } catch (err: any) {
    if (err.code === '23505') {
      return c.json({ error: 'Organization slug already taken' }, 409);
    }
    console.error('[admin] Create organization error:', err.message);
    return c.json({ error: 'Failed to create organization' }, 500);
  }
});

// ── Update Organization (admin override) ──
admin.patch('/organizations/:id', async (c) => {
  const orgId = c.req.param('id');
  const body = await c.req.json();

  try {
    const [updated] = await db
      .update(organizations)
      .set({
        name: body.name ?? undefined,
        plan: body.plan ?? undefined,
        isActive: body.isActive ?? undefined,
        logoUrl: body.logoUrl ?? undefined,
        primaryColor: body.primaryColor ?? undefined,
        secondaryColor: body.secondaryColor ?? undefined,
        customDomain: body.customDomain ?? undefined,
        emailFromName: body.emailFromName ?? undefined,
        footerText: body.footerText ?? undefined,
        settings: body.settings ?? undefined,
        updatedAt: new Date(),
      })
      .where(eq(organizations.id, orgId))
      .returning();

    if (!updated) {
      return c.json({ error: 'Organization not found' }, 404);
    }

    return c.json({ data: updated });
  } catch (err: any) {
    console.error('[admin] Update organization error:', err.message);
    return c.json({ error: 'Failed to update organization' }, 500);
  }
});

// ── Platform Settings (GET/PUT) ──
admin.get('/settings', async (c) => {
  try {
    const rows = await db.select().from(platformSettings);
    const settings: Record<string, any> = {};
    for (const row of rows) {
      settings[row.key] = row.value;
    }
    // Merge with defaults
    const defaults = {
      general: {
        platformName: 'OpenPDF Studio',
        supportEmail: 'support@openpdfstudio.com',
        defaultPlan: 'free',
        maxUploadSizeMB: 25,
        maintenanceMode: false,
      },
      branding: {
        primaryColor: '#6366F1',
        secondaryColor: '#8B5CF6',
        logoUrl: '',
        footerText: 'Powered by OpenPDF Studio',
      },
      notifications: {
        emailEnabled: true,
        smsEnabled: false,
        dailyDigest: true,
        weeklyReport: true,
        anomalyAlerts: true,
        slackWebhookUrl: '',
      },
      api: {
        webhookUrl: '',
        allowedOrigins: 'https://vagishkapila.github.io',
      },
      security: {
        requireEmailVerification: true,
        allowGoogleOAuth: true,
        sessionTimeoutHours: 24,
        maxLoginAttempts: 5,
        passwordMinLength: true,
        passwordRequireUppercase: true,
        passwordRequireNumber: true,
        passwordRequireSpecial: false,
        require2FA: false,
      },
    };
    // Overlay saved values on top of defaults
    for (const [key, val] of Object.entries(settings)) {
      if (defaults[key as keyof typeof defaults]) {
        defaults[key as keyof typeof defaults] = { ...defaults[key as keyof typeof defaults], ...val as any };
      }
    }
    return c.json({ success: true, data: defaults });
  } catch (error) {
    console.error('[admin] Failed to get settings:', error);
    return c.json({ success: false, error: 'Failed to load settings' }, 500);
  }
});

admin.put('/settings', async (c) => {
  try {
    const body = await c.req.json();
    const userId = (c as any).userId;

    // body should be { section: 'general' | 'branding' | etc, values: {...} }
    const { section, values } = body;
    if (!section || !values) {
      return c.json({ success: false, error: 'section and values required' }, 400);
    }

    // Upsert the setting
    await db
      .insert(platformSettings)
      .values({
        key: section,
        value: values,
        updatedBy: userId,
      })
      .onConflictDoUpdate({
        target: platformSettings.key,
        set: {
          value: values,
          updatedBy: userId,
          updatedAt: new Date(),
        },
      });

    return c.json({ success: true });
  } catch (error) {
    console.error('[admin] Failed to save settings:', error);
    return c.json({ success: false, error: 'Failed to save settings' }, 500);
  }
});

// ── System Health ──
admin.get('/system/health', async (c) => {
  return c.json({
    data: {
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
      nodeVersion: process.version,
      timestamp: new Date().toISOString(),
    }
  });
});

// ── Branding Config (per-user white-label) ──
admin.get('/branding', async (c) => {
  try {
    const userId = (c as any).userId;
    const { brandingConfigs } = await import('../../shared/db/schema');
    const [config] = await db.select()
      .from(brandingConfigs)
      .where(eq(brandingConfigs.userId, userId));

    return c.json(config || {
      companyName: 'OpenPDF Studio',
      primaryColor: '#6366f1',
      secondaryColor: '#8b5cf6',
      accentColor: '#a78bfa',
    });
  } catch (error: any) {
    return c.json({ error: error.message || 'Failed to load branding' }, 500);
  }
});

admin.put('/branding', async (c) => {
  try {
    const userId = (c as any).userId;
    const body = await c.req.json();
    const { brandingConfigs } = await import('../../shared/db/schema');

    const values = {
      userId,
      companyName: body.companyName || 'OpenPDF Studio',
      logoUrl: body.logoUrl || null,
      primaryColor: body.primaryColor || '#6366f1',
      secondaryColor: body.secondaryColor || '#8b5cf6',
      accentColor: body.accentColor || '#a78bfa',
      customDomain: body.customDomain || null,
      emailFromName: body.emailFromName || null,
      emailFooterText: body.emailFooterText || null,
      signingPageTitle: body.signingPageTitle || null,
      signingPageSubtitle: body.signingPageSubtitle || null,
      updatedAt: new Date(),
    };

    const [existing] = await db.select()
      .from(brandingConfigs)
      .where(eq(brandingConfigs.userId, userId));

    let config;
    if (existing) {
      [config] = await db.update(brandingConfigs)
        .set(values)
        .where(eq(brandingConfigs.userId, userId))
        .returning();
    } else {
      [config] = await db.insert(brandingConfigs)
        .values(values)
        .returning();
    }

    return c.json({ success: true, branding: config });
  } catch (error: any) {
    return c.json({ error: error.message || 'Failed to update branding' }, 500);
  }
});

// ── Subscription Checkout ──
admin.post('/subscribe', async (c) => {
  try {
    const { env: appEnv } = await import('../../config/env');
    if (!appEnv.STRIPE_SECRET_KEY) {
      return c.json({ error: 'Stripe not configured' }, 503);
    }
    const Stripe = (await import('stripe')).default;
    const stripe = new Stripe(appEnv.STRIPE_SECRET_KEY);
    const userId = (c as any).userId;
    const user = await db.select().from(users).where(eq(users.id, userId)).then(r => r[0]);
    const origin = c.req.header('origin') || appEnv.FRONTEND_URL;

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      customer_email: user?.email,
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: 'OpenPDF Studio Pro',
            description: 'Monthly account fee — unlimited transactions, branded pages, document signing',
          },
          unit_amount: 1700,
          recurring: { interval: 'month' },
        },
        quantity: 1,
      }],
      success_url: `${origin}/openpdf-studio/dashboard.html?subscription=success`,
      cancel_url: `${origin}/openpdf-studio/pricing.html?subscription=cancelled`,
      metadata: { userId },
    });

    return c.json({ checkoutUrl: session.url, sessionId: session.id });
  } catch (error: any) {
    return c.json({ error: error.message || 'Failed to create subscription' }, 500);
  }
});

export default admin;
