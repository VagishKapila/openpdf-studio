# DocuFlow — Feature Roadmap

> Last updated: March 28, 2026

## Phase 1 — Core Dashboard (BUILDING NOW)
- [x] Dashboard home: stats, overdue alerts, quick actions, recent documents
- [x] Documents page: sortable table with status/time/search filters
- [x] Contacts page: per-client folder with document + payment history
- [x] Contact detail: drill into one client, see all docs, all payments, totals
- [x] Payments page: collected/pending/overdue breakdown, progress bar, filters
- [ ] Refund support (Stripe Refund API, refund button in payment history)
- [ ] Send reminder emails (overdue payment nudges with branded email)
- [ ] Connect dashboard to real backend APIs (auth, documents, payments)
- [ ] Redirect logged-in users from index.html to dashboard.html

## Phase 2 — Payment Features
- [ ] Recurring payments / autopay (monthly retainers, installment plans)
- [ ] Partial payments / payment plans (50% now, 50% on completion)
- [ ] Late fees (auto-apply after X days, configurable per document)
- [ ] Multiple payment methods (ACH bank transfer, Apple Pay, Google Pay)
- [ ] Payment receipts (auto-generated PDF receipt emailed to payer)
- [ ] Refund receipts (auto-email when refund is processed)
- [ ] Revenue dashboard (weekly/monthly/quarterly collection charts)
- [ ] Export payment data to CSV/Excel

## Phase 3 — Document Management
- [ ] Document templates (reusable contracts with merge fields)
- [ ] Template marketplace (share/sell templates)
- [ ] Bulk send (same document to multiple recipients)
- [ ] Expiring links (documents auto-expire after X days)
- [ ] Document versioning (track changes across versions)
- [ ] Audit trail (full log: viewed, signed, paid, with timestamps + IP)
- [ ] S3 cloud storage integration (upload/download from dashboard)
- [ ] Folder organization (custom folders, tags, labels)

## Phase 4 — Communication & Automation
- [ ] Automated reminder schedule (3 days, 7 days, 14 days after due date)
- [ ] Custom email templates (branded follow-up emails)
- [ ] In-app notifications (bell icon, activity feed)
- [ ] SMS reminders (optional add-on)
- [ ] Webhook integrations (Zapier, Make.com)
- [ ] Calendar integration (auto-schedule follow-ups)

## Phase 5 — Client Portal
- [ ] Client login (recipients create accounts to access their signed docs)
- [ ] Client dashboard (view all documents, payments, receipts in one place)
- [ ] Client-side document upload (clients can send docs back)
- [ ] White-label portal (businesses customize branding for their clients)

## Phase 6 — Business Features
- [ ] Team accounts (multiple users under one business)
- [ ] Role-based access (admin, sender, viewer)
- [ ] Custom branding (logo, colors, domain)
- [ ] API access (developers can integrate DocuFlow into their apps)
- [ ] Analytics & reporting (conversion rates, average time to sign, etc.)
- [ ] Multi-currency support

## Monetization Tiers
- **Free**: 5 documents/month, basic signing, email support
- **Pro** ($X/month): Unlimited documents, payment collection, templates, reminders
- **Business** ($X/month): Team accounts, white-label, API access, priority support

## Integrations to Consider
- Stripe (payments — already integrated)
- HoneyBook-style autopay and late fees
- QuickBooks / Xero (accounting sync)
- Google Drive / Dropbox (document storage)
- Slack / Teams (notifications)
- CRM integrations (Salesforce, HubSpot)
