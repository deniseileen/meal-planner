"""Remove the original martians' heads/antennae poking above the counter line.
Usage: python patch_kitchen.py <in.webp> <out.png>"""
import sys
from PIL import Image, ImageFilter, ImageDraw

src = Image.open(sys.argv[1]).convert("RGB")
out = src.copy()

def paste(dst_box, dx, dy=0, feather=4):
    """Copy the region offset by (dx,dy) into dst_box with feathered edges."""
    x0, y0, x1, y1 = dst_box
    patch = src.crop((x0 + dx, y0 + dy, x1 + dx, y1 + dy))
    mask = Image.new("L", patch.size, 0)
    ImageDraw.Draw(mask).rectangle((feather, feather, patch.size[0] - feather, patch.size[1] - feather), fill=255)
    mask = mask.filter(ImageFilter.GaussianBlur(feather / 2))
    out.paste(patch, (x0, y0), mask)

def stretch_cols(dst_box, src_x0, src_x1, feather=4):
    """Fill dst_box by horizontally stretching a clean strip (good for wood grain)."""
    x0, y0, x1, y1 = dst_box
    patch = src.crop((src_x0, y0, src_x1, y1)).resize((x1 - x0, y1 - y0), Image.BILINEAR)
    mask = Image.new("L", patch.size, 0)
    ImageDraw.Draw(mask).rectangle((feather, feather, patch.size[0] - feather, patch.size[1] - feather), fill=255)
    mask = mask.filter(ImageFilter.GaussianBlur(feather / 2))
    out.paste(patch, (x0, y0), mask)

# left martian: antenna over window sill + tiles
paste((274, 293, 334, 352), 52)
# counter surface: back strip (stops before the vase) and front strip, sampled from clean wood
stretch_cols((196, 344, 386, 386), 548, 568)
stretch_cols((380, 370, 446, 390), 548, 568, feather=1)
stretch_cols((196, 380, 446, 402), 470, 520, feather=1)
# centre martian: antenna over tiles, head over counter
paste((596, 316, 652, 352), -54)
paste((646, 316, 704, 352), -104, feather=1)
stretch_cols((570, 344, 708, 386), 548, 568)
stretch_cols((530, 380, 710, 402), 470, 520, feather=1)
# right martian antenna over fruit bowl: replace with clean tiles + counter
paste((920, 334, 970, 378), 128)
paste((966, 338, 1012, 378), 84, feather=1)
stretch_cols((918, 372, 1014, 412), 1000, 1008, feather=1)

out.save(sys.argv[2])
