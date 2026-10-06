"""Build optimized, responsive images for the Bombon Spa site.

Usage:  python scripts/optimize_images.py
Reads   assets/originals/*.jpeg / *.png
Writes  assets/img/<name>-<width>.webp and .jpg  (widths capped at source size)
        assets/img/logo-mask.png, emblem-mask.png  (white-on-transparent, used as CSS masks)
        assets/favicon.png

Each entry in JOBS is (output name, source file, crop box or None).
Crop boxes are in source pixels (left, top, right, bottom).
"""
from pathlib import Path
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "assets" / "originals"
OUT = ROOT / "assets" / "img"
WIDTHS = (480, 960, 1440)
WEBP_Q = 78
JPEG_Q = 80

# Poster photo panel: the text-free photograph on the right of each 960x1280 poster.
PANEL = (392, 330, 958, 1102)

JOBS = [
    # Full pieces, used as "magazine pages"
    ("cover", "Cover.png", None),
    ("services", "Our Services - Approved.png", None),
    ("poster-pure", "pure.jpeg", None),
    ("poster-reset", "reset.jpeg", None),
    ("poster-glow", "glow.jpeg", None),
    ("poster-silence", "silence.jpeg", None),
    # Clean photographs cropped from the posters
    ("photo-massage", "reset.jpeg", PANEL),
    ("photo-hammam", "silence.jpeg", PANEL),
    ("photo-moroccan", "pure.jpeg", PANEL),
    ("photo-facial", "glow.jpeg", PANEL),
    # Detail crops
    ("detail-back", "reset.jpeg", (40, 434, 288, 666)),
    ("detail-nails", "reset.jpeg", (40, 797, 288, 1034)),
    ("detail-chocolate", "silence.jpeg", (565, 820, 880, 1010)),
    ("detail-foam", "silence.jpeg", (400, 660, 800, 900)),
    ("detail-brush", "glow.jpeg", (560, 520, 958, 860)),
    ("cover-face", "Cover.png", (430, 290, 830, 870)),
    ("wide-bowls", "silence.jpeg", (392, 650, 958, 1010)),
    ("cover-turban", "Cover.png", (440, 275, 780, 735)),
    ("cover-magazine", "Cover.png", (230, 720, 1000, 1280)),
]


def save_variants(img: Image.Image, name: str) -> list[str]:
    written = []
    src_w = img.width
    widths = sorted({w for w in WIDTHS if w < src_w} | {min(src_w, WIDTHS[-1])})
    for w in widths:
        h = round(img.height * w / img.width)
        resized = img if w == img.width else img.resize((w, h), Image.LANCZOS)
        webp = OUT / f"{name}-{w}.webp"
        jpg = OUT / f"{name}-{w}.jpg"
        resized.save(webp, "WEBP", quality=WEBP_Q, method=6)
        resized.save(jpg, "JPEG", quality=JPEG_Q, optimize=True, progressive=True)
        written.append(f"{name}-{w} ({w}x{h})")
    return written


# Brand lockup, cut from the cream-on-dark logo at the top of the cover.
LOGO_BOX = (36, 30, 984, 266)
EMBLEM_W = 240  # emblem = left part of the lockup
OLIVE = (76, 81, 60)
CREAM = (245, 236, 220)


def logo_alpha(emblem_only: bool = False) -> Image.Image:
    """Cream pixels -> opaque, dark background -> transparent (blue channel ramp)."""
    box = LOGO_BOX
    cover = Image.open(SRC / "Cover.png").convert("RGB")
    a = cover.crop(box).getchannel("B").point(
        lambda v: 0 if v < 110 else 255 if v > 200 else (v - 110) * 255 // 90)
    draw = ImageDraw.Draw(a)
    left, top = box[0], box[1]
    draw.rectangle((470 - left, 244 - top, a.width, a.height), fill=0)  # towel top
    draw.rectangle((0, 240 - top, 300 - left, a.height), fill=0)        # "SHERATON" caption
    if emblem_only:
        a = a.crop((0, 0, EMBLEM_W, a.height))
    return a.crop(a.getbbox())


def save_logos() -> None:
    for name, emblem_only in (("logo-mask", False), ("emblem-mask", True)):
        a = logo_alpha(emblem_only)
        img = Image.new("RGBA", a.size, (255, 255, 255, 0))
        img.putalpha(a)
        img.save(OUT / f"{name}.png", optimize=True)
        print(f"{name} ({a.width}x{a.height})")
    # Favicon: olive emblem on a cream tile
    a = logo_alpha(True)
    side = round(max(a.size) * 1.35)
    tile = Image.new("RGB", (side, side), CREAM)
    tile.paste(OLIVE, ((side - a.width) // 2, (side - a.height) // 2), mask=a)
    tile.resize((64, 64), Image.LANCZOS).save(ROOT / "assets" / "favicon.png", optimize=True)
    tile.resize((180, 180), Image.LANCZOS).save(ROOT / "assets" / "apple-touch-icon.png", optimize=True)
    print("favicon.png, apple-touch-icon.png")


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    for name, src, box in JOBS:
        img = Image.open(SRC / src).convert("RGB")
        if box:
            img = img.crop(box)
        for line in save_variants(img, name):
            print(line)
    save_logos()
    total = sum(p.stat().st_size for p in OUT.glob("*.webp"))
    print(f"\nTotal WebP weight: {total / 1024:.0f} KB")


if __name__ == "__main__":
    main()
