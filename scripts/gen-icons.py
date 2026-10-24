#!/usr/bin/env python3
"""Generate iSusuPro PWA icons (192/512/maskable + apple-touch) from brand spec."""
from PIL import Image, ImageDraw, ImageFont

def make_icon(size: int, maskable: bool = False) -> Image.Image:
    img = Image.new('RGB', (size, size), '#059669')  # brand emerald background
    d = ImageDraw.Draw(img)

    # Decorative gradient circles
    r = size * 0.62
    d.ellipse([size - r * 0.9, size - r * 0.9, size + r * 0.9, size + r * 0.9], fill='#047857')
    d.ellipse([-r * 0.8, -r * 0.8, r * 0.8, r * 0.8], fill='#10b981')

    # White rounded card
    pad = size * (0.24 if maskable else 0.18)
    card = [pad, pad, size - pad, size - pad]
    d.rounded_rectangle(card, radius=int(size * 0.10), fill='#FFFFFF')

    # "S" lettermark + susu coin
    try:
        font_size = int((size - pad * 2) * 0.62)
        font = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', font_size)
    except OSError:
        font = ImageFont.load_default()
    text = 'S'
    bbox = d.textbbox((0, 0), text, font=font)
    tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
    x = (size - tw) / 2 - bbox[0]
    y = (size - th) / 2 - bbox[1] - size * 0.04
    d.text((x, y), text, fill='#059669', font=font)

    # Gold coin dot (susu)
    coin_r = size * (0.055 if maskable else 0.07)
    cx, cy = size - pad * 1.35, size - pad * 1.35
    d.ellipse([cx - coin_r, cy - coin_r, cx + coin_r, cy + coin_r], fill='#F59E0B', outline='#D97706', width=max(2, size // 128))
    return img

for size, maskable in [(192, False), (512, False), (512, True)]:
    suffix = '-maskable' if maskable else ''
    make_icon(size, maskable).save(f'/home/z/my-project/public/icon-{size}{suffix}.png', optimize=True)
    print(f'icon-{size}{suffix}.png')

make_icon(180, False).save('/home/z/my-project/public/apple-touch-icon.png', optimize=True)
print('apple-touch-icon.png')
