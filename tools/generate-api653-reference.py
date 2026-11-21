"""Rebuild the requested API 653 reference inventory from the owner's supplied PDF.

Usage: python tools/generate-api653-reference.py <path-to-API-653.pdf>
Requires pymupdf and Pillow. Source page offsets remain internal provenance only.
"""
import hashlib
import io
import json
import re
import sys
from pathlib import Path

import pymupdf
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SOURCE = Path(sys.argv[1])
DOC = pymupdf.open(SOURCE)
ASSETS = ROOT / 'apps/mobile/public/reference/api653'
ASSETS.mkdir(parents=True, exist_ok=True)

# Inclusive source ranges reviewed against the actual body, not the stale TOC.
TOPICS = [
 ('4.1a', 'Shell stresses', 'Table 4.1a — Maximum Allowable Shell Stresses (SI)', 28, 29),
 ('6.1', 'Section 6 — Inspection', 'General', 48, 48),
 ('6.2', 'Section 6 — Inspection', 'Inspection frequency considerations', 48, 48),
 ('6.3', 'Section 6 — Inspection', 'Outside inspections: routine, external, UT and CP', 48, 49),
 ('6.4', 'Section 6 — Inspection', 'Internal inspection: intervals, safeguards, RBI and deferral', 49, 55),
 ('6.5', 'Section 6 — Inspection', 'External-access alternative for bottom thickness', 55, 55),
 ('6.6', 'Section 6 — Inspection', 'Preparatory work for internal inspection', 55, 55),
 ('6.7', 'Section 6 — Inspection', 'Inspection checklists', 55, 55),
 ('6.8', 'Section 6 — Inspection', 'Records', 55, 55),
 ('6.9', 'Section 6 — Inspection', 'Reports and recommendations', 56, 57),
 ('6.10', 'Section 6 — Inspection', 'Nondestructive examination personnel', 57, 57),
 ('9.1', 'Section 9 — Repair and alteration', 'General: approval, verification and documentation', 62, 62),
 ('9.2', 'Section 9 — Repair and alteration', 'Shell plate replacement and door sheets', 62, 67),
 ('9.3', 'Section 9 — Repair and alteration', 'Lap-welded shell patches', 65, 69),
 ('9.4', 'Section 9 — Repair and alteration', 'Nonmetallic repairs', 69, 69),
 ('9.5', 'Section 9 — Repair and alteration', 'Defects in shell plate material', 69, 70),
 ('9.6', 'Section 9 — Repair and alteration', 'Changing shell height', 70, 70),
 ('9.7', 'Section 9 — Repair and alteration', 'Defective welds', 70, 70),
 ('9.8', 'Section 9 — Repair and alteration', 'Existing shell penetrations', 70, 71),
 ('9.9', 'Section 9 — Repair and alteration', 'Added or replacement shell penetrations', 70, 72),
 ('9.10', 'Section 9 — Repair and alteration', 'Altering existing penetrations and tombstones', 72, 76),
 ('9.11', 'Section 9 — Repair and alteration', 'Bottom patches, critical zone, replacement and additional plates', 74, 82),
 ('9.12', 'Section 9 — Repair and alteration', 'Fixed roofs and supporting structure', 82, 83),
 ('9.13', 'Section 9 — Repair and alteration', 'Floating roofs and pontoon leaks', 83, 83),
 ('9.14', 'Section 9 — Repair and alteration', 'Floating-roof perimeter seals', 83, 84),
 ('9.15', 'Section 9 — Repair and alteration', 'Hot taps: restrictions, preparation, installation and testing', 84, 87),
 ('A', 'Annexes', 'Background on past editions', 112, 113),
 ('B', 'Annexes', 'Evaluation of tank bottom settlement', 114, 131),
 ('C', 'Annexes', 'Checklists for tank inspection', 132, 148),
 ('D', 'Annexes', 'Authorized inspector certification', 150, 151),
 ('E', 'Annexes', 'Intentionally left blank', 152, 152),
 ('F', 'Annexes', 'NDE requirements summary', 154, 156),
 ('G', 'Annexes', 'Intentionally left blank', 158, 158),
 ('H', 'Annexes', 'Similar service assessment', 160, 173),
 ('I', 'Annexes', 'Inquiries and suggestions for change', 174, 176),
 ('J', 'Annexes', 'Shell plate repairs using nonmetallic materials', 178, 180),
 ('R', 'Annexes', 'Additional inspection references', 182, 183),
 ('S', 'Annexes', 'Austenitic stainless steel tanks', 184, 185),
 ('SC', 'Annexes', 'Stainless and carbon steel mixed-material tanks', 186, 187),
 ('X', 'Annexes', 'Duplex stainless steel tanks', 188, 189),
 ('Y', 'Annexes', 'Bibliography', 190, 190),
]
NORMATIVE = {'B', 'D', 'F', 'S', 'SC', 'X'}
pages = {}
for n in sorted({n for _, _, _, a, b in TOPICS for n in range(a, b+1)}):
    page = DOC[n-1]
    text = page.get_text()
    # Headings occupy their own text line. Only actual body headings are indexed.
    clauses = list(dict.fromkeys(re.findall(r'^(?:[469]|[A-Z]{1,2})(?:\.\d+)+(?=\s*$)', text, re.M)))
    artwork = list(dict.fromkeys(re.findall(r'^(?:Figure|Table)\s+[A-Z0-9]+\.\d+[ab]?(?=\s*—)', text, re.M)))
    prefix = '4' if n < 48 else '6' if n < 62 else '9' if n < 112 else next(
        id for id, group, _, a, b in TOPICS if group == 'Annexes' and a <= n <= b)
    artwork = [art for art in artwork if art.split()[1].startswith(prefix+'.')]
    # The F.1 acceptance, qualification and procedure lists continue without a
    # repeated table caption. Keep them attached when filtering to Table F.1.
    if n == 156:
        artwork.append('Table F.1')
    # Remove font-encoding control characters from search; images retain the exact source.
    searchable = re.sub(r'[\x00-\x08\x0b-\x1f\x7f-\x9f]', ' ', text)
    filename = f'extract-{n:03}.webp'
    pix = page.get_pixmap(matrix=pymupdf.Matrix(2, 2).prerotate(90 if n in (77, 78) else 0), alpha=False)
    im = Image.open(io.BytesIO(pix.tobytes('png')))
    im.save(ASSETS / filename, 'WEBP', lossless=True, method=6)
    pages[str(n)] = {'file': filename, 'clauses': clauses, 'artwork': artwork,
                     'searchText': ' '.join(searchable.split()), 'width': im.width, 'height': im.height}

topics = []
for id, group, title, a, b in TOPICS:
    source_ids = [str(n) for n in range(a, b+1)]
    clauses = list(dict.fromkeys(c for n in source_ids for c in pages[n]['clauses']
                               if c == id or c.startswith(id+'.')))
    if id == '4.1a':
        clauses = []
    artworks = list(dict.fromkeys(art for n in source_ids for art in pages[n]['artwork']))
    if id == '4.1a':
        artworks = ['Table 4.1a']
    status = ('Intentionally blank' if id in ('E','G') else
              'Normative if specified by the purchaser' if id == 'J' else
              'Normative' if id in NORMATIVE or group != 'Annexes' else 'Informative')
    # Include continuation extracts through the next non-child heading. This
    # prevents a clause filter from hiding conditions carried over a sheet break.
    headings = [(c, n) for n in source_ids for c in pages[n]['clauses']]
    clause_sources = {}
    for clause in clauses:
        starts = [i for i, (c, _) in enumerate(headings) if c == clause]
        if not starts:
            continue
        i = starts[0]
        start = int(headings[i][1])
        end = next((int(n) for c, n in headings[i+1:] if not c.startswith(clause+'.')), b)
        clause_sources[clause] = [str(n) for n in range(start, min(end, b)+1)]
    topics.append({'id': id, 'group': group, 'title': title, 'status': status,
                   'sources': source_ids, 'clauses': clauses, 'clauseSources': clause_sources, 'artwork': artworks})

result = {'edition': 'API 653, fifth edition with supplied addenda through July 2025',
          'sourceSha256': hashlib.sha256(SOURCE.read_bytes()).hexdigest(),
          'topics': topics, 'sources': pages}
target = ROOT / 'apps/mobile/src/reference/api653-library.json'
target.write_text(json.dumps(result, ensure_ascii=False, separators=(',', ':'))+'\n', encoding='utf-8')
print(f'{len(topics)} topics; {len(pages)} complete source extracts; {sum((ASSETS / p["file"]).stat().st_size for p in pages.values()) / 1048576:.1f} MiB')
