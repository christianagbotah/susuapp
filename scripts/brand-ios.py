#!/usr/bin/env python3
"""Brand the iOS native chrome: App Store icon + launch splash + Info.plist copy.

Mirrors scripts/brand-android.py: emerald gradient background, brand circles,
white rounded card with the 'S' lettermark and gold coin.

Idempotent — safe to re-run after `cap sync ios` (sync never overwrites
Assets.xcassets or Info.plist).

What it does:
  1. AppIcon.appiconset  — copy the Tauri-generated 1024x1024 icon, flattened
                           to RGB (App Store icons must not carry an alpha channel)
  2. Splash.imageset     — branded 2732x2732 launch image written to all three
                           scales referenced by Contents.json
  3. LaunchScreen.storyboard — brand-emerald background behind the splash image
  4. Info.plist          — iSusuPro-specific permission strings (camera for
                           Ghana Card OCR, location for agent routes, Face ID,
                           photo library) + remote-notification background mode
"""
import plistlib
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path('/home/z/my-project')
IOS_APP = ROOT / 'ios' / 'App' / 'App'
XCASSETS = IOS_APP / 'Assets.xcassets'

BRAND_BG = '#059669'
BRAND_DARK = '#047857'
BRAND_LIGHT = '#10B981'

# Tauri-generated App Store icon (1024x1024, same artwork as the other platforms)
ICON_SRC = ROOT / 'src-tauri' / 'icons' / 'ios' / 'AppIcon-512@2x.png'

# Splash files referenced by Splash.imageset/Contents.json (all 2732x2732)
SPLASH_FILES = ['splash-2732x2732.png', 'splash-2732x2732-1.png', 'splash-2732x2732-2.png']


def make_splash(size: int = 2732) -> Image.Image:
    """Emerald gradient background + white rounded card with 'S' + coin."""
    w = h = size
    img = Image.new('RGB', (w, h), BRAND_BG)
    d = ImageDraw.Draw(img)

    # Subtle brand circles (same motif as the app icon)
    r = min(w, h) * 0.9
    d.ellipse([w - r * 0.55, -r * 0.55, w + r * 0.55, r * 0.55], fill=BRAND_DARK)
    d.ellipse([-r * 0.5, h - r * 0.5, r * 0.5, h + r * 0.5], fill=BRAND_LIGHT)

    # White rounded card with S lettermark — sized off the shorter edge
    s = min(w, h)
    card = s * 0.28
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


def brand_icon() -> None:
    dst = XCASSETS / 'AppIcon.appiconset' / 'AppIcon-512@2x.png'
    img = Image.open(ICON_SRC).convert('RGB')  # strip alpha (App Store requirement)
    img.save(dst, optimize=True)
    print(f'✓ AppIcon 1024×1024 (RGB, no alpha) → {dst.relative_to(ROOT)}')


def brand_splash() -> None:
    img = make_splash()
    for name in SPLASH_FILES:
        img.save(XCASSETS / 'Splash.imageset' / name, optimize=True)
    print(f'✓ Splash 2732×2732 ×{len(SPLASH_FILES)} scales → Splash.imageset/')


def brand_launch_storyboard() -> None:
    sb = IOS_APP / 'Base.lproj' / 'LaunchScreen.storyboard'
    xml = sb.read_text()
    # Replace the white system background behind the splash imageView with brand emerald
    old = '<color key="backgroundColor" systemColor="systemBackgroundColor"/>'
    new = ('<color key="backgroundColor" red="0.0196078431372549" '
           'green="0.5882352941176471" blue="0.4117647058823529" alpha="1" '
           'colorSpace="custom" customColorSpace="sRGB"/>')
    if old in xml:
        sb.write_text(xml.replace(old, new, 1))
        print('✓ LaunchScreen.storyboard background → #059669')
    elif new in xml:
        print('• LaunchScreen.storyboard already branded')
    else:
        print('! LaunchScreen.storyboard: expected color node not found — skipped')


def brand_info_plist() -> None:
    plist_path = IOS_APP / 'Info.plist'
    with plist_path.open('rb') as f:
        plist = plistlib.load(f)

    usage = {
        'NSCameraUsageDescription':
            'iSusuPro uses the camera to scan Ghana Cards and verify customer identity.',
        'NSPhotoLibraryUsageDescription':
            'iSusuPro lets you attach customer documents and receipts from your photo library.',
        'NSPhotoLibraryAddUsageDescription':
            'iSusuPro saves collection receipts to your photo library.',
        'NSLocationWhenInUseUsageDescription':
            'iSusuPro records where collections happen so susu agents can plan daily routes.',
        'NSFaceIDUsageDescription':
            'iSusuPro uses Face ID for fast, secure sign-in to your susu account.',
        'NSMicrophoneUsageDescription':
            'iSusuPro does not record audio; this prompt can only appear alongside camera use.',
    }
    plist.update(usage)
    # Push notifications: wake the app silently for contribution reminders
    plist['UIBackgroundModes'] = ['remote-notification']
    # Skip the App Store export-compliance questionnaire each submission
    plist['ITSAppUsesNonExemptEncryption'] = False

    with plist_path.open('wb') as f:
        plistlib.dump(plist, f)
    print(f'✓ Info.plist → {len(usage)} permission strings + background modes')


def main() -> None:
    brand_icon()
    brand_splash()
    brand_launch_storyboard()
    brand_info_plist()


if __name__ == '__main__':
    main()
