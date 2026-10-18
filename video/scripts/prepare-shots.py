#!/usr/bin/env python3
"""Copy the app screenshots the videos use into public/shots and cut the pieces the scenes animate.

Run from video/ after refreshing ../docs/media/screenshots (needs Pillow, numpy and scipy):

    python3 scripts/prepare-shots.py

What it writes:
- public/shots/<screenshot>.png           the screenshots themselves
- public/shots/cloud-<lang>/<word>.png    each word of the presenter word cloud, transparent
- public/shots/open-<lang>/card-<n>.png   each answer card of the presenter open question
- public/shots/phone-mc-idle-<lang>.png   the first option card, not yet selected
- public/shots/phone-scale-idle-<lang>.png the "4" button, not yet selected
- src/data/shots.ts                       where each piece sits on its screenshot

The word rectangles below are measured by hand on the current screenshots (the cloud packs words
too tightly to separate them automatically). If the cloud screenshots change, update them: each
rectangle only has to contain the centre of every letter of its word.
"""

from __future__ import annotations

import json
import shutil
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage as ndi

VIDEO = Path(__file__).resolve().parent.parent
SOURCE = VIDEO.parent / "docs" / "media" / "screenshots"
SHOTS = VIDEO / "public" / "shots"
DATA = VIDEO / "src" / "data" / "shots.ts"

PAGE = np.array([244, 244, 245])  # --page (emerald, light)
CLOUD_TIERS = {1: (0x06, 0x4E, 0x3B), 2: (0x04, 0x78, 0x57), 3: (0x05, 0x96, 0x69)}

COPY = [
    *(f"{name}-{lang}-light.png" for lang in ("en", "tr") for name in (
        "editor", "editor-types", "phone-home", "phone-mc", "phone-cloud", "phone-scale", "phone-open",
        "phone-thanks", "present-mc", "present-cloud", "present-scale", "present-open",
    )),
    *(f"theme-{theme}-{screen}-{lang}.png" for theme in ("emerald", "indigo", "navy", "blue")
      for screen in ("present", "phone") for lang in ("en", "tr")),
]

# Word cloud: (file slug, word, tier, x0, y0, x1, y1) in screenshot pixels (2160×1350).
CLOUD_WORDS = {
    "en": [
        ("momentum", "momentum", 1, 335, 600, 1828, 788),
        ("growth", "growth", 1, 640, 796, 1312, 992),
        ("learning", "learning", 2, 878, 452, 1520, 624),
        ("exciting", "exciting", 2, 1332, 820, 1814, 953),
        ("chaotic", "chaotic", 2, 1840, 575, 1950, 1018),
        ("shipping", "shipping", 2, 776, 962, 1292, 1094),
        ("rewarding", "rewarding", 3, 455, 426, 860, 520),
        ("focused", "focused", 3, 532, 550, 858, 624),
        ("teamwork", "teamwork", 3, 248, 553, 322, 962),
        ("fun", "fun", 3, 454, 790, 498, 868),
        ("intense", "intense", 3, 522, 794, 600, 1102),
        ("ambitious", "ambitious", 3, 394, 802, 440, 1028),
        ("busy", "busy", 3, 1400, 940, 1512, 992),
    ],
    "tr": [
        ("ogretici", "öğretici", 1, 428, 392, 612, 1082),
        ("verimli", "verimli", 3, 598, 632, 638, 792),
        ("odakli", "odaklı", 2, 652, 502, 734, 782),
        ("yogun", "yoğun", 1, 882, 442, 1418, 616),
        ("ivme", "ivme", 1, 752, 576, 1408, 788),
        ("buyume", "büyüme", 1, 632, 798, 1502, 1012),
        ("zorlu", "zorlu", 2, 612, 992, 838, 1058),
        ("takim", "takım", 2, 1036, 998, 1294, 1068),
        ("hizli", "hızlı", 3, 1416, 736, 1464, 838),
        ("heyecanli", "heyecanlı", 2, 1492, 516, 1624, 1148),
        ("keyifli", "keyifli", 2, 1622, 656, 1704, 938),
    ],
}


def rgb(path: Path) -> np.ndarray:
    return np.array(Image.open(path).convert("RGB")).astype(int)


def extract_cloud(lang: str) -> list[dict]:
    image = rgb(SOURCE / f"present-cloud-{lang}-light.png")
    distance = np.abs(image - PAGE).sum(axis=2)
    ink = distance > 25
    ink[:300] = False
    ink[1250:] = False
    labels, count = ndi.label(ndi.binary_dilation(ink, np.ones((3, 3))))
    words = CLOUD_WORDS[lang]
    owner: dict[int, int] = {}
    for component, region in enumerate(ndi.find_objects(labels), start=1):
        ys, xs = np.nonzero(labels[region] == component)
        cy, cx = ys.mean() + region[0].start, xs.mean() + region[1].start
        inside = [i for i, w in enumerate(words) if w[3] <= cx <= w[5] and w[4] <= cy <= w[6]]
        if not inside:
            raise SystemExit(f"{lang}: letter at ({cx:.0f}, {cy:.0f}) is in no word rectangle")
        owner[component] = min(inside, key=lambda i: (words[i][5] - words[i][3]) * (words[i][6] - words[i][4]))
    out_dir = SHOTS / f"cloud-{lang}"
    shutil.rmtree(out_dir, ignore_errors=True)
    out_dir.mkdir(parents=True)
    placed = []
    for index, (slug, text, tier, *_rect) in enumerate(words):
        mask = np.isin(labels, [c for c, i in owner.items() if i == index])
        mask = ndi.binary_dilation(mask, np.ones((3, 3)))
        ys, xs = np.nonzero(mask)
        y0, y1, x0, x1 = ys.min() - 2, ys.max() + 3, xs.min() - 2, xs.max() + 3
        colour = np.array(CLOUD_TIERS[tier])
        # Undo the anti-aliasing against the page so the word composites cleanly on any page.
        crop = image[y0:y1, x0:x1]
        span = colour - PAGE
        alpha = ((crop - PAGE) * span).sum(axis=2) / (span * span).sum()
        alpha = np.clip(alpha, 0, 1) * mask[y0:y1, x0:x1]
        rgba = np.zeros((*alpha.shape, 4), dtype=np.uint8)
        rgba[..., :3] = colour
        rgba[..., 3] = np.round(alpha * 255).astype(np.uint8)
        Image.fromarray(rgba, "RGBA").save(out_dir / f"{slug}.png", optimize=True)
        placed.append({"file": f"shots/cloud-{lang}/{slug}.png", "text": text, "tier": tier,
                       "x": int(x0), "y": int(y0), "width": int(x1 - x0), "height": int(y1 - y0)})
    return placed


def extract_cards(lang: str) -> list[dict]:
    path = SOURCE / f"present-open-{lang}-light.png"
    image = rgb(path)
    white = (image == 255).all(axis=2)
    white[:300] = False
    labels, _ = ndi.label(white)
    cards = []
    for region in ndi.find_objects(labels):
        ys, xs = region
        if ys.stop - ys.start > 40 and xs.stop - xs.start > 200:
            cards.append((xs.start, ys.start, xs.stop, ys.stop))
    cards.sort(key=lambda c: (c[1], c[0]))  # reading order
    out_dir = SHOTS / f"open-{lang}"
    shutil.rmtree(out_dir, ignore_errors=True)
    out_dir.mkdir(parents=True)
    source = Image.open(path).convert("RGB")
    placed = []
    for n, (x0, y0, x1, y1) in enumerate(cards):
        box = (x0 - 6, y0 - 6, x1 + 6, y1 + 6)  # the border and a margin of page
        source.crop(box).save(out_dir / f"card-{n}.png", optimize=True)
        placed.append({"file": f"shots/open-{lang}/card-{n}.png", "x": box[0], "y": box[1],
                       "width": box[2] - box[0], "height": box[3] - box[1]})
    return placed


def idle_option(lang: str) -> None:
    """The first option card as it looks before anyone taps it: card 2's frame, card 1's label."""
    image = Image.open(SOURCE / f"phone-mc-{lang}-light.png").convert("RGB")
    idle = image.crop((48, 1035, 1122, 1227))
    label = image.crop((200, 807 + 14, 1100, 999 - 14))
    idle.paste(label, (200 - 48, 14))
    idle.save(SHOTS / f"phone-mc-idle-{lang}.png", optimize=True)


def idle_scale(lang: str) -> None:
    """The "4" button before it is tapped: button 5's frame with the 4 drawn in ink."""
    image = rgb(SOURCE / f"phone-scale-{lang}-light.png")
    selected = image[807:975, 708:903]
    frame = image[807:975, 927:1122].copy()
    brand = np.array([4, 120, 87])
    white = np.array([255, 255, 255])
    ink = np.array([24, 24, 27])
    inner = (slice(12, -12), slice(12, -12))
    frame[inner] = white
    glyph = ((selected - brand) * (white - brand)).sum(axis=2) / ((white - brand) ** 2).sum()
    glyph = np.clip(glyph, 0, 1)[inner][..., None]
    frame[inner] = np.round(white * (1 - glyph) + ink * glyph)
    Image.fromarray(frame.astype(np.uint8), "RGB").save(SHOTS / f"phone-scale-idle-{lang}.png", optimize=True)


def main() -> None:
    SHOTS.mkdir(parents=True, exist_ok=True)
    for old in SHOTS.glob("*.png"):
        old.unlink()
    for name in COPY:
        shutil.copyfile(SOURCE / name, SHOTS / name)
    data = {"cloud": {}, "cards": {}}
    for lang in ("en", "tr"):
        data["cloud"][lang] = extract_cloud(lang)
        data["cards"][lang] = extract_cards(lang)
        idle_option(lang)
        idle_scale(lang)
    DATA.parent.mkdir(parents=True, exist_ok=True)
    DATA.write_text(
        "// Generated by scripts/prepare-shots.py. Do not edit by hand.\n"
        "// Positions are in screenshot pixels (2160×1350).\n\n"
        "export type ShotPiece = {\n"
        "  readonly file: string;\n  readonly x: number;\n  readonly y: number;\n"
        "  readonly width: number;\n  readonly height: number;\n};\n\n"
        "export type CloudWord = ShotPiece & { readonly text: string; readonly tier: 1 | 2 | 3 };\n\n"
        f"export const cloudWords: Record<\"en\" | \"tr\", readonly CloudWord[]> = {json.dumps(data['cloud'], ensure_ascii=False, indent=2)};\n\n"
        f"export const openCards: Record<\"en\" | \"tr\", readonly ShotPiece[]> = {json.dumps(data['cards'], indent=2)};\n",
        encoding="utf-8",
    )
    print(f"{len(COPY)} screenshots, {sum(len(v) for v in data['cloud'].values())} words, "
          f"{sum(len(v) for v in data['cards'].values())} cards")


if __name__ == "__main__":
    main()
