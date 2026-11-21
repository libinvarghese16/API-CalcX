# Tank reference supplement review — 2026-11-21

Scope: mobile Reference page only. Existing calculation engines, inputs and results are unchanged.

Expanded assessment considerations supplement the existing API 650/653 clause summaries. Generic planning guidance is labeled separately. Related standards distinguish locally verified clauses from scope-only cross-references and older editions.

Sources: supplied API 650 14th edition (2025), API 653 fifth-edition compilation through 2025, local API RP 651 fifth edition (August 2024), and API RP 652 sixth edition (December 2025). API 652 scan pages 38–40 were visually reviewed, corresponding to printed pages 32–34. API RP 575 local third edition (2014) is explicitly identified as older; current clause reconciliation is pending. API 2000, 2350, 2015, 2207 and TR 654 are supplementary scope references, not a complete verified requirements library.

Five selected source-page screenshots have edition/page captions and full-size links. The user explicitly requested these screenshots, overriding AGENTS.md's default exclusion of copied figures. Full source PDFs are not included. API 653 Figure 9.13a is rotated for readability, without changing dimensions or content.

Validation: browser component harness at 390, 768 and 1440 pixels in light/dark themes; no horizontal overflow or runtime errors. Verified multi-selection/select-all/clear, search with no matches, part selection and successful source-image decoding. Existing application authentication and navigation remain unchanged. Typecheck, regression tests and production build run separately.

Final validation: all 295 tests passed (95 mobile + 200 engine), TypeScript checks passed, and production build passed. The aggregate check remains blocked by pre-existing legacy-source hash differences (index.html/scripts.js) and pressure-vessel material-catalog drift against the parent-folder source. Those external sources, baseline records and generated calculation data were not changed by this reference-only work.
