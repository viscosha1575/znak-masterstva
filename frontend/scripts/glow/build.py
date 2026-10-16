"""Rebuilds the glows whose blur Figma cannot export.

    python3 scripts/glow/build.py [name ...]        # all of them by default

In the mockups these nine shapes carry a PROGRESSIVE layer blur: its radius
runs from `start` at one point of the shape's box to `end` at another. Figma's
SVG export flattens that to a plain blur of the end radius, several times too
sharp over most of the shape, so the exported SVGs in sources/ are only the
input here: the shape is drawn without its blur, blurred with a radius of its
own for every pixel, and saved to src/assets/images/glow/<name>.webp with the
very canvas the SVG had - the pages place it exactly as they would the SVG.

Two numbers were fitted against Figma's own renders of these layers (mean
difference 0.3-0.7 of 255):
  - Figma draws a blur of radius r with a Gaussian of sigma = 0.415 r,
    not the r / 2 its SVG export writes;
  - hence the plain blurs of the other shapes in a group are multiplied by 0.83.

The parameters below are read from the layers through the Figma plugin API
(`effects`, `width`, `height`, `absoluteTransform`). If a mockup changes,
re-export the SVG into sources/, update its entry and run this again.

Needs: Python with numpy and Pillow, `cwebp`, Chrome, and playwright-core
(`npm i --no-save playwright-core` in frontend/).
"""
import json
import os
import subprocess
import sys
import tempfile

import numpy as np
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
SOURCES = os.path.join(HERE, "sources")
OUT = os.path.normpath(os.path.join(HERE, "../../src/assets/images/glow"))
TMP = tempfile.mkdtemp(prefix="glow-")

SIGMA = 0.415  # Gaussian sigma per unit of Figma blur radius
REST = 0.83  # correction of the plain blurs in the same file (0.415 / 0.5)

# Where the blur starts and ends, as fractions of the shape's box.
TRACK = dict(so=(0.67683524, 0.72148228), eo=(0.50000012, 0.99999905))
PAGE = dict(so=(0.45400944, 0.25515968), eo=(0.12264151, 0.94934410))

# start/end: blur radius; size: the shape's box; origin: where that box starts
# on the SVG canvas (the blur's margin); scale: pixels per mockup pixel.
GLOWS = {
    # Desktop
    "page-glow": dict(start=100, end=35.4756, size=(2001.9734, 1910.1654), origin=(146.7473, 100), scale=0.4, **PAGE),
    "track-glow": dict(start=93.9913, end=24.4377, size=(1543, 867), origin=(93.9913, 93.9913), scale=0.5, **TRACK),
    # Phone
    "m-track-glow-1": dict(start=50, end=13, size=(729, 409.6536), origin=(50, 50), scale=0.6, **TRACK),
    "m-track-glow-2": dict(start=50, end=13, size=(848.7664, 476.955), origin=(50, 50), scale=0.6, **TRACK),
    "m-hero-gradient-2": dict(start=77.8, end=27.6, size=(623.5972, 594.9998), origin=(77.8, 77.8), scale=0.6, **PAGE),
    "m-account-gradient": dict(start=77.8, end=27.6, size=(623.5972, 594.9998), origin=(77.8, 77.8), scale=0.6, **PAGE),
    "m-rating-gradient": dict(start=58.5, end=28, size=(828.1653, 446.6465), origin=(58.5, 58.5), scale=0.6, **PAGE),
    "m-contest-gradient": dict(start=58.5, end=28, size=(1225.6163, 661), origin=(58.5, 58.5), scale=0.6, **PAGE),
    # This shape is turned about two degrees inside the exported group, so its
    # box is placed by the two layers' absolute transforms instead.
    "m-hero-gradient-1": dict(
        start=94.7, end=19.5999, size=(317.4193, 213.1499), scale=0.6, **PAGE,
        shape=[[0.4414, 0.8951, 2798.7009], [0.8973, -0.4458, 2315.9141]],
        group=[[0.4103, 0.9119, 2795.2698], [0.9119, -0.4103, 2308.2891]],
        group_origin=(0.2533 * 507.1365, 0.5785 * 223.8649),
    ),
}


def matrix(rows):
    return np.array([rows[0], rows[1], [0, 0, 1]], float)


def box_to_canvas(glow):
    """Affine map from the shape's own box to the SVG canvas."""
    if "group" in glow:
        inside_group = np.linalg.inv(matrix(glow["group"])) @ matrix(glow["shape"])
        x, y = glow["group_origin"]
        return matrix([[1, 0, x], [0, 1, y]]) @ inside_group
    x, y = glow["origin"]
    return matrix([[1, 0, x], [0, 1, y]])


def blur(premultiplied, sigma, low, high, levels=40):
    """Blurs every pixel with its own sigma: a blend of uniformly blurred copies."""
    pad = int(np.ceil(4 * high)) + 2
    height, width = premultiplied.shape[:2]
    padded = np.zeros((height + 2 * pad, width + 2 * pad, 4))
    padded[pad:pad + height, pad:pad + width] = premultiplied
    spectrum = np.fft.rfft2(padded, axes=(0, 1))
    fy = np.fft.fftfreq(padded.shape[0])[:, None]
    fx = np.fft.rfftfreq(padded.shape[1])[None, :]
    radius2 = (fx * fx + fy * fy)[..., None]
    index = (np.clip(sigma, low, high) - low) / (high - low) * (levels - 1)
    result = np.zeros_like(premultiplied)
    for level, value in enumerate(np.linspace(low, high, levels)):
        weight = np.clip(1 - np.abs(index - level), 0, 1)
        if not weight.any():
            continue
        response = np.exp(-2 * np.pi**2 * value * value * radius2)
        copy = np.fft.irfft2(spectrum * response, s=padded.shape[:2], axes=(0, 1))
        result += weight[..., None] * copy[pad:pad + height, pad:pad + width]
    return np.clip(result, 0, 1)


def premultiply(path):
    image = np.asarray(Image.open(path).convert("RGBA")).astype(float) / 255
    image[..., :3] *= image[..., 3:]
    return image


def build(name):
    glow = GLOWS[name]
    os.makedirs(OUT, exist_ok=True)
    shape_png, rest_png, png = (f"{TMP}/{name}.{part}.png" for part in ("shape", "rest", "out"))
    info = json.loads(subprocess.check_output(
        ["node", f"{HERE}/layers.mjs", f"{SOURCES}/{name}.svg", str(glow["scale"]), shape_png, rest_png, str(REST)],
        cwd=os.path.dirname(os.path.dirname(HERE)),
    ))
    W, H, w, h = info["W"], info["H"], info["w"], info["h"]

    # Blur radius under every pixel: project the pixel onto the start-end line.
    to_box = np.linalg.inv(box_to_canvas(glow))
    ys, xs = np.mgrid[0:h, 0:w]
    cx, cy = (xs + 0.5) * W / w, (ys + 0.5) * H / h
    bx = to_box[0, 0] * cx + to_box[0, 1] * cy + to_box[0, 2]
    by = to_box[1, 0] * cx + to_box[1, 1] * cy + to_box[1, 2]
    bw, bh = glow["size"]
    sx, sy = glow["so"][0] * bw, glow["so"][1] * bh
    ex, ey = glow["eo"][0] * bw, glow["eo"][1] * bh
    along = ((bx - sx) * (ex - sx) + (by - sy) * (ey - sy)) / ((ex - sx) ** 2 + (ey - sy) ** 2)
    radius = glow["start"] + (glow["end"] - glow["start"]) * np.clip(along, 0, 1)
    pixels = w / W
    low, high = sorted((glow["start"] * SIGMA * pixels, glow["end"] * SIGMA * pixels))
    result = blur(premultiply(shape_png), radius * SIGMA * pixels, low, high)

    if info["others"]:  # the dark ellipses lie over the shape
        rest = premultiply(rest_png)
        result = rest + result * (1 - rest[..., 3:])

    alpha = result[..., 3:]
    colour = np.where(alpha > 1e-6, result[..., :3] / np.maximum(alpha, 1e-6), 0)
    rgba = np.concatenate([np.clip(colour, 0, 1), alpha], 2)
    Image.fromarray((rgba * 255 + 0.5).astype(np.uint8)).save(png)
    subprocess.check_call(["cwebp", "-quiet", "-q", "82", "-m", "6", "-sharp_yuv", png, "-o", f"{OUT}/{name}.webp"])
    print(f"{name}: {w}x{h}, {os.path.getsize(f'{OUT}/{name}.webp') / 1024:.1f} KB")


if __name__ == "__main__":
    for name in sys.argv[1:] or GLOWS:
        build(name)
