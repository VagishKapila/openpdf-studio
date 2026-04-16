# Changelog

All notable changes to OpenPDF Studio are documented in this file.

## [1.1.0] — 2026-04-16

### Added
- **Request Signatures** — Send documents to multiple signers via email. Each signer gets a unique, secure link. Track status (pending → signed → completed) from the dashboard. Multi-signer support with ordered signing queues.
- **Public signing page** (`/sign.html`) — Recipients can draw or type their signature, fill fields, and submit without creating an account.
- **Signature request dashboard** — View all sent requests, see per-signer status, send reminders, and download completed signed PDFs.
- **Server-side PDF flattening** — Signatures are permanently embedded into the PDF via pdf-lib on the backend (AWS S3 pipeline), not just overlaid client-side.
- **Auto-reminder emails** — Signers receive automatic follow-up reminders as deadlines approach.
- **Completion notification** — Sender receives an email when all parties have signed.
- **Payment-gated signing** — Optionally require a Stripe payment before document access is granted.
- **Admin dashboard** (`dashboard/`) — React 19 + TypeScript super-admin portal for user management, analytics, audit logs, revenue tracking, organization management, and white-label branding controls.
- **Multi-tenant organizations** — Create org workspaces with member roles (owner/admin/member/viewer), custom branding (logo, colors, domain), and isolated document pipelines.
- **White-label client portal** — Custom-branded signing and document management experience per organization.
- **Notification inbox** — In-app notification system with real-time updates.
- **Daily and weekly reports** — Auto-generated email digests for document pipeline activity.
- **AI document fingerprinting** — Pattern detection for recurring document types to speed up field placement.

### Changed
- **Rebranded to OpenPDF Studio** — All references to "DocPix Studio" and "DocuFlow" replaced throughout the frontend, backend, emails, and documentation.
- **Version bumped to 1.1.0** across `package.json`, `src-tauri/tauri.conf.json`, backend, dashboard, and editor packages.
- **Dashboard version indicator** updated to v1.1.0.
- `docuflow-landing.html` → `openpdf-landing.html`
- `docuflow-flow.jsx` → `openpdf-flow.jsx`
- `docpix-dashboard` npm package → `openpdf-dashboard`
- `docuflow-editor` npm package → `openpdf-editor`
- PDF protection metadata updated from `DocPixProtection` to `OpenPDFProtection`.
- Backend `app.ts` API name updated to `OpenPDF Studio API`.

### Fixed
- Auth modal now correctly shows verification email prompt after registration.
- Password reset flow invalidates all existing sessions on success.
- Google OAuth redirect URIs updated to include all staging and production origins.
- CORS origins updated to include Vercel dashboard domain.
- Email `from` address corrected to use verified `varshyl.com` domain (was `barshyrvirtual.com`).
- Token refresh correctly retries the original request on 401 before dispatching logout.

### Infrastructure
- Railway backend now deploys from `staging` branch.
- Vercel dashboard (`docpix-dashboard.vercel.app`) deploys from `feature/dashboard` branch.
- Resend verified domain: `varshyl.com`.
- AWS S3 bucket `dpstudio-documents` with SSE-S3 encryption.
- Stripe test mode configured (DocuFlowAI account).

---

## [1.0.0] — 2026-03-01

### Added
- Initial release of OpenPDF Studio.
- PDF viewer and editor powered by PDF.js, pdf-lib, and Fabric.js.
- Text annotations, shapes, and drawing tools.
- Signature drawing pad (draw or type).
- PDF merge and split.
- Image editing (crop, resize, rotate).
- Client-side e-signing flow (4-step wizard: Upload → Setup → Review → Finalize).
- Stripe Checkout payment integration.
- Email/password authentication with JWT refresh tokens.
- Google OAuth sign-in.
- Email verification and password reset flows.
- Branded HTML email templates (purple gradient, SVG logo).
- PWA manifest and service worker for offline support.
- Tauri 2.0 desktop app wrapper (macOS, Windows, Linux).
- GitHub Pages deployment at `snaphw.com/app/`.
