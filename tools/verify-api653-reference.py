"""Verify source coverage and lossless image fidelity against the supplied PDF.

Usage: python tools/verify-api653-reference.py <path-to-API-653.pdf>
"""
import hashlib
import json
import sys
from pathlib import Path

import pymupdf
from PIL import Image

root = Path(__file__).resolve().parents[1]
source = Path(sys.argv[1])
data = json.loads((root/'apps/mobile/src/reference/api653-library.json').read_text(encoding='utf-8'))
doc = pymupdf.open(source)
assert hashlib.sha256(source.read_bytes()).hexdigest() == data['sourceSha256'], 'Source edition changed'

# Independent audit of the complete requested body spans. Include the named
# intentionally blank annexes, but exclude entirely empty separator sheets.
expected = {28, 29, *range(48, 58), *range(62, 88)} | {
    n for n in range(112, 191) if doc[n-1].get_text().strip()
}
actual = set(map(int, data['sources']))
assert actual == expected, {'missing': sorted(expected-actual), 'extra': sorted(actual-expected)}
assert set(data['sources']) == {n for t in data['topics'] for n in t['sources']}, 'Unreachable source extract'
for sid, entry in data['sources'].items():
    n = int(sid)
    pix = doc[n-1].get_pixmap(matrix=pymupdf.Matrix(2, 2).prerotate(90 if n in (77, 78) else 0), alpha=False)
    image = Image.open(root/'apps/mobile/public/reference/api653'/entry['file']).convert('RGB')
    assert image.size == (pix.width, pix.height), f'Image dimensions: {sid}'
    assert image.tobytes() == pix.samples, f'Image differs from source: {sid}'
print(f'PASS: all {len(expected)} required source extracts are reachable and match complete PDF renderings pixel-for-pixel.')
