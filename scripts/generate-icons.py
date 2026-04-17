#!/usr/bin/env python3
"""
Generate all required icon sizes from assets/icon-source.svg
Outputs PNGs to assets/icons/, plus icon.png + icon.ico to src-tauri/icons/
Also creates a cross-platform .icns file using Pillow directly.
"""

import os
import sys
import io
import struct
import zlib
from pathlib import Path

# Install deps silently
os.system("pip install cairosvg Pillow --break-system-packages -q 2>/dev/null")

try:
    import cairosvg
    from PIL import Image
    print("✓ Dependencies loaded")
except ImportError as e:
    print(f"❌ Import error: {e}")
    sys.exit(1)

SVG_SOURCE = "assets/icon-source.svg"
OUTPUT_DIR = Path("assets/icons")
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
TAURI_ICONS = Path("src-tauri/icons")

SIZES = [16, 32, 64, 128, 256, 512, 1024]

print("\nGenerating icon sizes from SVG...")
pngs = {}

for size in SIZES:
    png_bytes = cairosvg.svg2png(url=SVG_SOURCE, output_width=size, output_height=size)
    img = Image.open(io.BytesIO(png_bytes)).convert("RGBA")
    filename = OUTPUT_DIR / f"icon_{size}x{size}.png"
    img.save(str(filename), "PNG")
    pngs[size] = img
    print(f"  ✓ {filename}")

# ── Tauri icon.png (512px) ──────────────────────────────────────────
pngs[512].save(str(TAURI_ICONS / "icon.png"), "PNG")
print(f"  ✓ {TAURI_ICONS}/icon.png (512×512)")

# ── Also copy required @2x sizes used by Tauri build ────────────────
pngs[128].save(str(TAURI_ICONS / "128x128.png"), "PNG")
pngs[256].save(str(TAURI_ICONS / "128x128@2x.png"), "PNG")
pngs[32].save(str(TAURI_ICONS / "32x32.png"), "PNG")
pngs[64].save(str(TAURI_ICONS / "64x64.png"), "PNG")
print(f"  ✓ {TAURI_ICONS}/128x128.png, 128x128@2x.png, 32x32.png, 64x64.png")

# ── Windows .ico (multi-size) ────────────────────────────────────────
ico_sizes = [(256, 256), (128, 128), (64, 64), (48, 48), (32, 32), (16, 16)]
ico_images = []
for w, h in ico_sizes:
    png_bytes = cairosvg.svg2png(url=SVG_SOURCE, output_width=w, output_height=h)
    ico_images.append(Image.open(io.BytesIO(png_bytes)).convert("RGBA"))

ico_images[0].save(
    str(TAURI_ICONS / "icon.ico"),
    format="ICO",
    sizes=ico_sizes,
    append_images=ico_images[1:],
)
print(f"  ✓ {TAURI_ICONS}/icon.ico (multi-size Windows)")

# ── macOS .icns (pure-Python, no iconutil needed) ───────────────────
# ICNS format: header + list of typed blocks
# Each block: OSType (4 bytes) + length (4 bytes, includes header) + PNG data

ICNS_TYPES = {
    16:   b'icp4',   # 16x16
    32:   b'icp5',   # 32x32
    64:   b'icp6',   # 64x64
    128:  b'ic07',   # 128x128
    256:  b'ic08',   # 256x256
    512:  b'ic09',   # 512x512
    1024: b'ic10',   # 1024x1024 (512@2x)
}

icns_blocks = bytearray()
for size, otype in ICNS_TYPES.items():
    png_bytes = cairosvg.svg2png(url=SVG_SOURCE, output_width=size, output_height=size)
    block_len = 8 + len(png_bytes)
    icns_blocks += otype
    icns_blocks += struct.pack(">I", block_len)
    icns_blocks += png_bytes

# ICNS file header: magic 'icns' + total file length (4 bytes big-endian)
total_len = 8 + len(icns_blocks)
icns_data = b'icns' + struct.pack(">I", total_len) + bytes(icns_blocks)

icns_path = TAURI_ICONS / "icon.icns"
icns_path.write_bytes(icns_data)
print(f"  ✓ {TAURI_ICONS}/icon.icns ({total_len:,} bytes, pure-Python)")

print("\n✅ All icons generated successfully.")
print(f"   PNGs: {OUTPUT_DIR}/")
print(f"   Tauri: {TAURI_ICONS}/")
