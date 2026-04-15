# OpenPDF Studio

> **The free, open-source alternative to Adobe Acrobat Pro.**
> Edit PDFs, collect e-signatures, run OCR, and get paid — all in one app. No subscription. No cloud. No BS.

[![License: MIT](https://img.shields.io/badge/License-MIT-5b4fff.svg)](LICENSE-MIT)
[![Platform](https://img.shields.io/badge/Platform-macOS%20%7C%20Windows%20%7C%20Linux-brightgreen)](https://github.com/VagishKapila/openpdf-studio/releases)
[![Version](https://img.shields.io/badge/Version-1.0.0-blue)](https://github.com/VagishKapila/openpdf-studio/releases/tag/v1.0.0)
[![Website](https://img.shields.io/badge/Website-snaphw.com-5b4fff)](https://snaphw.com)

**[⬇ Download for macOS](https://github.com/VagishKapila/openpdf-studio/releases/download/v1.0.0/OpenPDF.Studio_1.0.0_aarch64.dmg) · [⬇ Windows](https://github.com/VagishKapila/openpdf-studio/releases/download/v1.0.0/OpenPDF.Studio_1.0.0_x64-setup.exe) · [⬇ Linux](https://github.com/VagishKapila/openpdf-studio/releases/download/v1.0.0/OpenPDF.Studio_1.0.0_amd64.AppImage) · [🌐 Try in Browser](https://snaphw.com/app/)**

---

## Why OpenPDF Studio?

Adobe Acrobat costs **$25/month**. DocuSign charges **per envelope**. OpenPDF Studio is **free forever** — and it does more than both combined.

| Feature | OpenPDF Studio | Adobe Acrobat | DocuSign |
|---------|:--------------:|:-------------:|:--------:|
| Price | **Free** | $25/mo | $15+/mo |
| PDF Editing | ✅ | ✅ | ❌ |
| E-Signatures | ✅ | ✅ | ✅ |
| Payment Collection | ✅ Built-in | ❌ | ❌ |
| AI OCR (local) | ✅ | ✅ Cloud | ❌ |
| Open Source | ✅ MIT | ❌ | ❌ |
| Privacy (runs locally) | ✅ | ❌ | ❌ |
| App size | ~2.5 MB | ~4 GB | N/A |

---

## Features

### 📄 PDF Editing
- Add text, shapes, images, and annotations to any PDF
- Merge multiple PDFs into one file
- Split a PDF into separate documents
- Rotate, reorder, and delete pages
- Compress PDF file size
- Password-protect and encrypt PDFs
- Fill and save PDF forms

### 🤖 AI-Powered OCR (100% Local)
- Scan a paper document → instantly editable text
- Powered by Tesseract.js — same engine as Google
- 100+ languages supported
- Runs entirely on your computer — zero cloud upload, full privacy

### ✍️ E-Signatures
- Auto-detect signature fields in any PDF
- Draw or type your signature
- Sign all fields with one click
- Multi-signer support — send to others for signature
- Flatten signatures permanently into the PDF

### 💳 Payment Collection (Unique)
No other PDF tool does this. After signing, collect payment in the same workflow. Set a custom amount, generate a payment link or QR code, and track payment status per document. Powered by Stripe.

### 🖥️ Cross-Platform Native App
Built with **Tauri 2.0** (Rust) — not Electron. Result: a **2.5MB app** that launches instantly with almost no memory usage, natively on Apple Silicon and Intel Macs.

---

## Download

| Platform | Download | Notes |
|----------|----------|-------|
| **macOS (Apple Silicon)** | [.dmg ↓](https://github.com/VagishKapila/openpdf-studio/releases/download/v1.0.0/OpenPDF.Studio_1.0.0_aarch64.dmg) | M1/M2/M3 · Signed + Notarized |
| **macOS (Intel)** | [.dmg ↓](https://github.com/VagishKapila/openpdf-studio/releases/download/v1.0.0/OpenPDF.Studio_1.0.0_x64.dmg) | Intel Macs · Signed + Notarized |
| **Windows** | [.exe ↓](https://github.com/VagishKapila/openpdf-studio/releases/download/v1.0.0/OpenPDF.Studio_1.0.0_x64-setup.exe) | Windows 10/11 |
| **Linux (Ubuntu/Debian)** | [.deb ↓](https://github.com/VagishKapila/openpdf-studio/releases/download/v1.0.0/OpenPDF.Studio_1.0.0_amd64.deb) | |
| **Linux (Universal)** | [.AppImage ↓](https://github.com/VagishKapila/openpdf-studio/releases/download/v1.0.0/OpenPDF.Studio_1.0.0_amd64.AppImage) | Runs on any distro |

**macOS users:** Double-click the .dmg, drag to Applications. No Gatekeeper warnings — the app is signed with an Apple Developer ID and notarized.

---

## Quick Start (Development)

```bash
git clone https://github.com/VagishKapila/openpdf-studio.git
cd openpdf-studio
npm install
npm run tauri:dev    # dev mode with hot reload
npm run tauri:build  # production build
```

**Requirements:** Node.js 18+, Rust (stable) — see [SETUP_GUIDE.md](SETUP_GUIDE.md)

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Desktop | [Tauri 2.0](https://tauri.app/) — Rust backend, 60x smaller than Electron |
| UI | React 19 + TypeScript + Vite + Tailwind CSS |
| PDF Rendering | [PDF.js](https://mozilla.github.io/pdf.js/) (Mozilla) |
| PDF Editing | [pdf-lib](https://pdf-lib.js.org/) |
| Canvas | [Fabric.js](http://fabricjs.com/) |
| OCR | [Tesseract.js 5](https://tesseract.projectnaptha.com/) — 100% local, 100+ languages |
| Payments | [Stripe Checkout](https://stripe.com/payments/checkout) |
| Backend | Hono.js + TypeScript on Railway |
| Database | PostgreSQL + Drizzle ORM |
| Code Signing | Apple Developer ID — Signed + Notarized (SnapHomework / 58QM83PCDW) |

---

## Pricing

| Tier | Price | What's included |
|------|-------|-----------------|
| **Free** | $0 forever | Full PDF editor, OCR, local signing, all desktop features |
| **Starter** | $29/mo | Cloud sync, 100 sign requests/month, email notifications |
| **Pro** | $99/mo | Unlimited signing, payment collection, analytics dashboard |
| **Enterprise** | Custom | White-label, multi-tenant, custom domain, dedicated support |

---

## Contributing

Contributions are welcome! Open an issue first to discuss your idea, then submit a PR.

---

## License

OpenPDF Studio is dual-licensed under **MIT OR Apache-2.0**.

---

## About

Built by **[Vagish Kapila](https://github.com/VagishKapila)** · **[Varshyl Inc](https://varshyl.com)**

Vagish Kapila is a builder and entrepreneur working across construction tech, AI tools, and software development. OpenPDF Studio was built to give professionals — in construction, real estate, and small business — a free, privacy-first alternative to expensive document software.

**Website:** [snaphw.com](https://snaphw.com) · **Issues:** [GitHub Issues](https://github.com/VagishKapila/openpdf-studio/issues)

---

*© 2026 Vagish Kapila · Varshyl Inc*
