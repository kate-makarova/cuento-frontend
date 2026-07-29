#!/usr/bin/env python3
"""
Crop a screenshot to its content area by detecting and removing the
dark surrounding chrome (header, nav, background, footer margins).

Detection strategy: find the bounding box of rows and columns where
at least BRIGHT_FRACTION of pixels exceed BRIGHT_THRESHOLD in brightness.
This reliably isolates the light content box from the dark surroundings.

Usage:
    python crop_to_content.py <image.png> [<image.png> ...]

Each file is cropped in-place and saved as PNG.
"""

import sys
from pathlib import Path
from typing import Optional, Tuple
from PIL import Image
import numpy as np


BRIGHT_THRESHOLD = 150   # per-channel average brightness to call a pixel "light"
BRIGHT_FRACTION  = 0.30  # fraction of pixels in a row/col that must be "light"
PADDING          = 4     # pixels kept outside the detected content box
MIN_CROP_FRAC    = 0.05  # skip if neither dimension shrinks by at least this much


def find_content_bbox(img: Image.Image) -> Optional[Tuple[int, int, int, int]]:
    """
    Return (left, top, right, bottom) of the light content area, or None
    if the image has no significant dark border to remove.
    """
    arr = np.array(img.convert("RGB")).astype(float)
    h, w = arr.shape[:2]

    brightness = arr.mean(axis=2)                              # shape (h, w)
    bright_mask = brightness > BRIGHT_THRESHOLD                # True = light pixel

    row_frac = bright_mask.mean(axis=1)                        # fraction bright per row
    col_frac = bright_mask.mean(axis=0)                        # fraction bright per col

    bright_rows = np.where(row_frac >= BRIGHT_FRACTION)[0]
    bright_cols = np.where(col_frac >= BRIGHT_FRACTION)[0]

    if len(bright_rows) == 0 or len(bright_cols) == 0:
        return None

    top    = max(int(bright_rows[0])  - PADDING, 0)
    bottom = min(int(bright_rows[-1]) + PADDING + 1, h)
    left   = max(int(bright_cols[0])  - PADDING, 0)
    right  = min(int(bright_cols[-1]) + PADDING + 1, w)

    shrinks_height = (h - (bottom - top)) / h >= MIN_CROP_FRAC
    shrinks_width  = (w - (right  - left)) / w >= MIN_CROP_FRAC
    if not shrinks_height and not shrinks_width:
        return None

    return (left, top, right, bottom)


def crop_file(path: Path) -> bool:
    img = Image.open(path)
    bbox = find_content_bbox(img)
    if bbox is None:
        print(f"  skip  {path.name}  (no significant chrome detected)")
        return False
    cropped = img.crop(bbox)
    cropped.save(path)
    orig_w, orig_h = img.size
    new_w  = bbox[2] - bbox[0]
    new_h  = bbox[3] - bbox[1]
    print(f"  crop  {path.name}  {orig_w}×{orig_h} → {new_w}×{new_h}")
    return True


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)

    for arg in sys.argv[1:]:
        p = Path(arg)
        if not p.exists():
            print(f"  not found: {p}", file=sys.stderr)
            continue
        crop_file(p)
