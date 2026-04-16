# OpenPDF Studio — Complete SEO Reference Brief
## (Paste this entire doc into a new chat to write SEO content, README, and website copy)

---

## 1. WHO BUILT THIS

**Creator:** Vagish Kapila
**GitHub:** VagishKapila (vaakapila@gmail.com)
**Company:** Varshyl Inc — construction software, AI tools, and software development
**Other products:** Sentio Development Inc (general contracting), SnapClaps, ConstructionAI Billing, OpenPDF Studio

---

## 2. WHAT THE PRODUCT IS

### Names (multiple — use the right one per context):
- **OpenPDF Studio** — the SaaS/web platform name (full feature set)
- **OpenPDF Studio** — the open-source desktop app name (GitHub repo name)
- **OpenPDF StudioAI** — the e-signature + payment workflow product layer
- **snaphw.com** — the live website/domain (GitHub Pages)

### One-liner:
> "The free, open-source alternative to Adobe Acrobat Pro. Edit PDFs, collect e-signatures, process payments, and manage document workflows — all in one place. No subscription."

### Tagline (from ROLLOUT-PLAN.md):
> "The PDF editor Adobe should have made."

---

## 3. WHAT IT DOES (Features — be specific for SEO)

### Core PDF Editing
- Open, view, and edit any PDF
- Add text, shapes, images, and annotations
- Draw or type signatures directly on PDFs
- Merge multiple PDFs into one
- Split a PDF into separate files
- Compress PDF file size
- Rotate, reorder, and delete pages
- Password-protect (encrypt/decrypt) PDFs
- Fill and save PDF forms

### Smart OCR (AI-powered)
- Scan a paper document → instantly make it editable text
- Handles 100+ languages
- Word-level text detection with layout preservation
- Runs 100% locally — no cloud, no API cost, full privacy

### E-Signatures (OpenPDF StudioAI layer)
- Upload a PDF → auto-detect signature fields (name, date, initials)
- Draw or type your signature
- Sign all fields with one click
- Multi-signer support (send requests to others via email)
- Flatten/embed signatures permanently into the PDF
- Download the signed PDF instantly
- 4-step guided signing wizard

### Payment Collection (unique feature)
- After signing, optionally collect payment from the signer
- Set a custom amount and description
- Stripe Checkout integration (test mode available)
- Payment link + QR code generation
- Track payment status per document

### Admin Dashboard (SaaS layer)
- Super admin dashboard with 78 KPIs
- User management, audit log, revenue breakdown
- Multi-tenant architecture (white-label for businesses)
- Document pipeline Kanban (Draft → Sent → Signed → Paid → Complete)
- Analytics: docs sent, signed, pending, revenue, avg time to sign
- Smart signing reminders and notifications

### Platform Support
- **macOS** (Apple Silicon + Intel) — .dmg, signed + notarized (no Gatekeeper warnings)
- **Windows** — .exe installer
- **Linux** — .deb (Ubuntu/Debian) + .AppImage (universal)
- **Web** — GitHub Pages (snaphw.com)
- **Mobile** — planned (React Native / Capacitor)

---

## 4. WHO IT'S FOR (Target audience for SEO)

### Primary users:
- Freelancers and consultants who need to sign contracts
- Small business owners tired of paying $25+/month for Adobe Acrobat
- Real estate agents who send documents for signature
- Contractors and construction professionals (Vagish's core audience)
- HR teams processing onboarding paperwork
- Lawyers and paralegals handling client agreements

### Pain points it solves:
- "Adobe Acrobat costs too much" — this is FREE
- "DocuSign charges per envelope" — no per-doc fees here
- "I need to collect payment after someone signs" — built in
- "I don't want my documents stored on someone's cloud" — runs locally
- "I need white-label signing for my business" — enterprise tier available

---

## 5. PRICING (for SEO landing pages)

| Tier | Price | Features |
|------|-------|----------|
| **Free / Open Source** | $0 | Full PDF editor, basic signing, local use |
| **Starter** | $29/mo | Cloud sync, 100 sign requests/mo, email notifications |
| **Pro** | $99/mo | Unlimited signing, payment collection, analytics dashboard |
| **Enterprise** | Custom | White-label, multi-tenant, custom domain, dedicated support |

---

## 6. TECH STACK (for developer-facing SEO / GitHub README)

| Layer | Technology |
|-------|-----------|
| Desktop Framework | Tauri 2.0 (Rust backend — 10x smaller than Electron) |
| UI | React 19 + TypeScript + Vite + Tailwind CSS |
| PDF Rendering | PDF.js (Mozilla — same engine as Firefox) |
| PDF Editing | pdf-lib (create, merge, annotate, flatten) |
| Canvas/Annotations | Fabric.js |
| OCR | Tesseract.js 5 (100% local, 100+ languages) |
| E-Signatures | Custom signing engine (client-side PDF flattening) |
| Payments | Stripe Checkout |
| Backend | Hono.js + TypeScript on Railway |
| Database | PostgreSQL with Drizzle ORM |
| Auth | JWT + Google OAuth + email verification |
| Email | Resend (noreply@varshyl.com) |
| Storage | AWS S3 (dpstudio-documents) |
| Code Signing | Apple Developer ID — SnapHomework (58QM83PCDW) |
| State Management | Zustand |
| App size | ~2.5MB (vs Electron's ~150MB) |

---

## 7. LIVE URLS (important for SEO / backlinks)

| What | URL |
|------|-----|
| Main website | https://snaphw.com |
| GitHub repo | https://github.com/VagishKapila/openpdf-studio |
| GitHub Pages editor | https://vagishkapila.github.io/openpdf-studio/ |
| Admin dashboard | https://app.snaphw.com |
| Backend API | https://openpdf-studio-production.up.railway.app |
| macOS download (M1/M2/M3) | https://github.com/VagishKapila/openpdf-studio/releases/download/v1.0.0/OpenPDF.Studio_1.0.0_aarch64.dmg |
| macOS download (Intel) | https://github.com/VagishKapila/openpdf-studio/releases/download/v1.0.0/OpenPDF.Studio_1.0.0_x64.dmg |
| Windows download | https://github.com/VagishKapila/openpdf-studio/releases/download/v1.0.0/OpenPDF.Studio_1.0.0_x64-setup.exe |
| Linux .deb | https://github.com/VagishKapila/openpdf-studio/releases/download/v1.0.0/OpenPDF.Studio_1.0.0_amd64.deb |
| Linux .AppImage | https://github.com/VagishKapila/openpdf-studio/releases/download/v1.0.0/OpenPDF.Studio_1.0.0_amd64.AppImage |

---

## 8. SEO KEYWORDS TO TARGET

### High-intent (people ready to download/buy):
- free adobe acrobat alternative
- free PDF editor Mac
- open source PDF editor
- free PDF signer
- free docusign alternative
- PDF editor no subscription
- sign PDF free
- edit PDF without adobe

### Feature-specific:
- PDF OCR editor free
- collect payment after signing document
- white label e-signature software
- PDF editor for contractors
- free document workflow software
- merge split PDF free
- password protect PDF free Mac

### Long-tail (blog/SEO articles):
- how to sign a PDF without adobe acrobat
- best free PDF editors for Mac 2025
- docusign alternatives for small business
- how to edit scanned PDF for free
- open source document signing software

---

## 9. COMPETITOR COMPARISON (for SEO positioning)

| Feature | OpenPDF Studio | Adobe Acrobat | DocuSign | HelloSign |
|---------|--------------|---------------|----------|-----------|
| Price | FREE | $25/mo | $15+/mo | $15+/mo |
| PDF Editing | ✅ Full | ✅ Full | ❌ | ❌ |
| E-Signatures | ✅ | ✅ | ✅ | ✅ |
| Payment Collection | ✅ Built-in | ❌ | ❌ | ❌ |
| OCR | ✅ Local AI | ✅ Cloud | ❌ | ❌ |
| White-label | ✅ | ❌ | Expensive | Expensive |
| Open Source | ✅ MIT | ❌ | ❌ | ❌ |
| Privacy (local) | ✅ | ❌ Cloud | ❌ Cloud | ❌ Cloud |
| Mac App (signed) | ✅ | ✅ | N/A | N/A |

---

## 10. ABOUT THE DEVELOPER (for About pages, GitHub bio, SEO)

**Vagish Kapila** is a builder and entrepreneur working across construction tech, AI tools, and software development. Based in [location], he runs **Varshyl Inc**, which builds software for the construction industry, and **Sentio Development Inc**, a general contracting and development company.

OpenPDF Studio was built to solve a real problem: professionals in construction, real estate, and small business pay hundreds of dollars per year for Adobe Acrobat just to sign and edit PDFs. Vagish built a free, open-source replacement that also handles payments — something no other document tool offers out of the box.

Other products by Vagish:
- **ConstructionAI Billing** — AI-powered invoice and billing for contractors
- **SnapClaps** — [social/video product]
- **BrandOS** — personal brand scoring and content generation platform

---

## 11. GITHUB README — CURRENT STATE (needs rewrite)

The current README is very developer-focused and dry. It says "Developer: VagishKapila" but has no mention of "Vagish Kapila" as a full name, no pricing, no comparison to Adobe, and no SEO-friendly language. The install instructions are technical and buried.

**What the README needs:**
- Hero: bold tagline + what it replaces
- Badges: license, version, platform support, stars
- Screenshot or demo GIF
- "Why OpenPDF Studio?" section (vs Adobe, vs DocuSign)
- Quick install (one-liner download, not 10 steps)
- Feature list with emojis
- Pricing table
- Author credit: "Built by Vagish Kapila · Varshyl Inc"
- Links to website, releases, issues

---

## 12. WEBSITE (snaphw.com) — WHAT TO BUILD

The site serves the GitHub Pages frontend (the actual PDF editor). The homepage should also function as a marketing/landing page.

**Current state:** The editor loads directly — no marketing page, no SEO meta tags, no "About", no download CTA.

**What it needs:**
- `/` — Marketing landing page with hero, features, pricing, download buttons
- `/app` or `/editor` — The actual PDF editor app (current state)
- Proper `<title>`, `<meta description>`, Open Graph tags
- Schema.org structured data (SoftwareApplication type)
- Blog section for SEO articles (optional but high-value)
- Footer with: © Vagish Kapila · Varshyl Inc · GitHub · Contact

**Structured data to add (JSON-LD):**
```json
{
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "OpenPDF Studio",
  "operatingSystem": "Windows, macOS, Linux",
  "applicationCategory": "BusinessApplication",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "USD"
  },
  "author": {
    "@type": "Person",
    "name": "Vagish Kapila",
    "url": "https://github.com/VagishKapila"
  },
  "description": "Free, open-source alternative to Adobe Acrobat Pro. Edit PDFs, collect e-signatures, and process payments.",
  "downloadUrl": "https://github.com/VagishKapila/openpdf-studio/releases",
  "softwareVersion": "1.0.0"
}
```

---

## 13. HOW TO USE THIS BRIEF IN A NEW CHAT

Paste this entire document into a new chat and say one of:

**For GitHub README:**
> "Using this brief, write a complete GitHub README.md for OpenPDF Studio / OpenPDF Studio. Make it SEO-optimized, include badges, a features table, comparison to Adobe Acrobat, pricing, and proper author credit for Vagish Kapila."

**For website homepage:**
> "Using this brief, write the complete HTML/React landing page for snaphw.com — the OpenPDF Studio website. Include hero, features, competitor comparison table, pricing, download buttons, and proper SEO meta tags. Modern design, purple brand color (#6366f1)."

**For SEO blog articles:**
> "Using this brief, write a 1500-word SEO article titled 'Best Free Adobe Acrobat Alternatives for Mac in 2025' that naturally positions OpenPDF Studio as the top choice."

**For App Store / Product Hunt listing:**
> "Using this brief, write a Product Hunt launch post and tagline for OpenPDF Studio by Vagish Kapila."
