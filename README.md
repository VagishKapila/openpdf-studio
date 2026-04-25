# FormIQ — Your Documents Should Work for You. With AI.

FormIQ is a privacy-first PDF editor and e-signature platform. Open, annotate,
sign, and manage PDFs entirely on-device — no server uploads, no accounts required.
AI-assisted features help you work smarter with every document.

## Features

- **PDF editing** — text annotations, highlights, freehand drawing
- **E-signatures** — draw, type, or upload — placed anywhere on the page
- **Local-first** — all files stored in IndexedDB, never leave your device
- **PWA** — installable on iOS and Android, works offline
- **File Handler API** — open PDFs directly from your OS file picker (Android)

## Live App

[https://app.snaphw.com](https://app.snaphw.com)

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19 + TypeScript + Vite |
| Styling | Tailwind CSS v4 |
| State | Zustand |
| Storage | Dexie (IndexedDB) |
| PDF rendering | PDF.js |
| Annotations | Konva.js |
| Gestures | @use-gesture/react |
| Signatures | signature_pad |
| PWA | vite-plugin-pwa + Workbox |
| Hosting | Railway (project `openpdf-pwa`, branch `pwa-main`) |

## Development

```bash
pnpm install
pnpm --filter @openpdf/pwa dev
```

## Build

```bash
pnpm --filter @openpdf/pwa build
```

## Monorepo structure

```
apps/
  pwa/          # FormIQ PWA
tools/
  scripts/      # deploy.sh
  test-fixtures/
```

## License

MIT
