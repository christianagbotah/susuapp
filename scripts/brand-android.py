#!/usr/bin/env python3
"""Brand the Android native chrome: launcher background colour + splash screens.

Replaces the default Capacitor white background / robot splash with iSusuPro
brand emerald (#059669) and the S-lettermark splash. Idempotent — safe to
re-run after `cap sync` (which never overwrites res/ drawables).
"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path('/home/z/my-project')
RES = ROOT / 'android' / 'app' / 'src' / 'main' / 'res'

BRAND_BG = '#059669'
BRAND_DARK = '#047857'
BRAND_LIGHT = '#10B981'

# Same sizes Capacitor's template ships (drawable/, drawable-land-*dpi/, drawable-port-*dpi/)
SPLASH_SIZES = {
    'drawable': (480, 320),
    'drawable-land-mdpi': (800, 480),
    'drawable-land-hdpi': (1200, 720),
    'drawable-land-xhdpi': (1600, 960),
    'drawable-land-xxhdpi': (2400, 1440),
    'drawable-land-xxxhdpi': (3200, 1920),
    'drawable-port-mdpi': (480, 800),
    'drawable-port-hdpi': (720, 1200),
    'drawable-port-xhdpi': (960, 1600),
    'drawable-port-xxhdpi': (1440, 2400),
    'drawable-port-xxxhdpi': (1920, 3200),
}


def make_splash(w: int, h: int) -> Image.Image:
    """Emerald gradient background + white rounded card with 'S' + coin."""
    img = Image.new('RGB', (w, h), BRAND_BG)
    d = ImageDraw.Draw(img)

    # Subtle brand circles (same motif as the app icon)
    r = min(w, h) * 0.9
    d.ellipse([w - r * 0.55, -r * 0.55, w + r * 0.55, r * 0.55], fill=BRAND_DARK)
    d.ellipse([-r * 0.5, h - r * 0.5, r * 0.5, h + r * 0.5], fill=BRAND_LIGHT)

    # White rounded card with S lettermark — sized off the shorter edge
    s = min(w, h)
    card = s * 0.28
    pad = (s - card) / 2
    cx, cy = w / 2, h / 2
    d.rounded_rectangle(
        [cx - card / 2, cy - card / 2, cx + card / 2, cy + card / 2],
        radius=int(card * 0.18), fill='#FFFFFF',
    )
    try:
        font = ImageFont.truetype(
            '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', int(card * 0.6)
        )
    except OSError:
        font = ImageFont.load_default()
    bbox = d.textbbox((0, 0), 'S', font=font)
    tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
    d.text(
        (cx - tw / 2 - bbox[0], cy - th / 2 - bbox[1] - card * 0.02),
        'S', fill=BRAND_BG, font=font,
    )
    # Gold coin dot
    coin_r = card * 0.09
    d.ellipse(
        [cx + card * 0.24 - coin_r, cy + card * 0.24 - coin_r,
         cx + card * 0.24 + coin_r, cy + card * 0.24 + coin_r],
        fill='#F59E0B', outline='#D97706', width=max(2, s // 400),
    )
    return img


def main() -> None:
    # 1) Launcher adaptive-icon background → brand emerald
    bg_file = RES / 'values' / 'ic_launcher_background.xml'
    bg_file.write_text(
        '<?xml version="1.0" encoding="utf-8"?>\n'
        '<resources>\n'
        f'    <color name="ic_launcher_background">{BRAND_BG}</color>\n'
        '</resources>\n'
    )
    print('✓ ic_launcher_background → #059669')

    # 2) Branded splash screens in every density bucket
    for folder, (w, h) in SPLASH_SIZES.items():
        out = RES / folder / 'splash.png'
        if out.parent.exists():
            make_splash(w, h).save(out, optimize=True)
            print(f'✓ {folder}/splash.png ({w}×{h})')


if __name__ == '__main__':
    main()
