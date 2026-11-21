# API 653 reference coverage review

Scope: the mobile app's Reference > Tank > API 653 clauses and annexes view. No calculation engine, calculator input, report, authentication or unrelated equipment module was modified.

## Coverage

- Section 6: every topic 6.1–6.10, including routine/external/UT/CP inspection, initial and subsequent internal intervals, Table 6.1 safeguard credits and conditions, RBI, all standard-deferral conditions, alternative examination, preparation, checklists, records, reports and NDE personnel.
- Table 4.1a: both SI source extracts, including the continued rows and lettered notes. The reconstructed-tank exclusion is explicit. Values were not transcribed into or substituted for calculator material data.
- Section 9: every topic 9.1–9.15, all 15 figures (9.1–9.12, 9.13a/b and 9.14) and both tables (9.1a/b). The final 9.15.5.3 pressure-test equation continuation and 9.15.5.4 are included.
- All annex body entries in the supplied compilation: A, B, C, D, E, F, G, H, I, J, R, S, SC, X and Y. Normative, informative, conditional and intentionally blank status is shown separately.
- Annex C includes both complete checklist tables; F includes its acceptance, qualification and procedure continuation even when filtering to Table F.1; H includes its complete datasheets; J includes both parts of Table J.1.

The supplied body intentionally leaves E and G blank. Historical G-table entries remain in its contents list; absent G tables were not recreated. Historical publication and certification information is labeled by the supplied edition, not represented as a current administrative rule.

## Content and provenance

There are 41 selectable topics and 507 unique numbered clause/checklist entries, with original reading considerations and 111 complete source-image extracts. The summaries are explicitly a reading guide; all original conditions, lettered items, equations, notes, tables and drawings remain accessible through the complete topic source sequence. A narrowed clause filter includes source continuations through the next non-child heading. Shared context may include adjoining clauses.

The source SHA-256 and source offsets are retained in the generated inventory for verification, not shown as citation page numbers. On-screen citations use clause/subclause, table and figure identifiers. API 650 references in the supplied API 653 text remain references; this update does not claim a complete API 650 annex library.

The user's explicit request for all relevant table/figure screenshots overrides AGENTS.md's default exclusion. No full PDF is shipped. Source images are lossless WebP; landscape patch drawings are rotated for reading without cropping or changing content. The library loads as a separate module and the reader displays one source image at a time. Existing offline precaching includes these assets.

## Verification

- `tools/verify-api653-reference.py` compares the independently enumerated requested body spans and verifies every image pixel against a full PDF rendering. All 111 images passed.
- Reviewed contact sheets for every source image, plus representative full-size figures/tables and application screenshots.
- Browser checks traversed all 41 topics and 563 clause/figure/table selections, verified all 111 image decodes, table continuation navigation, search, empty results, group filtering, and unchanged part selection/select-all/clear behavior.
- Checked 390, 768 and 1440 pixel widths in light/dark themes: no horizontal overflow or runtime errors.
- All 301 automated tests (101 mobile and 200 engine), TypeScript checks and production build passed before release.

Legacy-source baseline/material-catalog reconciliation had existing discrepancies in the earlier supplement review. This change leaves those sources, baseline records and calculator datasets untouched.
