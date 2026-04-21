# Desktop migration (phase 2)

The current desktop app lives in the separate repo `openpdf-studio` and
is NOT touched during the PWA rebuild. This folder is a placeholder.

When ready (after PWA ships and stabilizes), the Tauri shell will
import from @openpdf/core and @openpdf/ui so desktop and PWA share
all logic.
