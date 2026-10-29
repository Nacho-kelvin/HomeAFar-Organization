#!/usr/bin/env python3
"""Create responsive WebP derivatives for photos in source-originals/ and register them in src/images.json.

Usage: python3 scripts/build-images.py "<file name in source-originals>" [more files...]
Originals are never modified. Widths never exceed the original width (no upscaling).
"""
import json, re, sys, pathlib
from PIL import Image, ImageOps

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC, OUT, MANIFEST = ROOT / 'source-originals', ROOT / 'assets/images/homeafar', ROOT / 'src/images.json'
WIDTHS = [480, 800, 1200, 1600]

def slug(name):
    return re.sub(r'^-|-$', '', re.sub(r'[^a-z0-9]+', '-', pathlib.Path(name).stem.lower()))

manifest = json.loads(MANIFEST.read_text())
for name in sys.argv[1:]:
    im = ImageOps.exif_transpose(Image.open(SRC / name)).convert('RGB')
    s, (w, h) = slug(name), im.size
    widths = [x for x in WIDTHS if x < w] + [w]
    for x in widths:
        r = im if x == w else im.resize((x, round(h * x / w)), Image.LANCZOS)
        r.save(OUT / f'{s}-{x}.webp', 'WEBP', quality=84, method=6)
    manifest[s] = {'w': widths, 'width': w, 'height': h, 'kind': 'real'}
    print(s, widths)
MANIFEST.write_text(json.dumps(manifest, indent=1) + '\n')
