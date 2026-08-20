# Version 1 calculation inventory

Status: inventory work started; counts and calculator-level identifiers will be populated by the controlled source audit.

| Module | Version 1 | Current action |
| --- | --- | --- |
| API 510 | Included | All seven validated geometry calculators are directly accessible in the mobile library and use the shared input, project, review and report workflow; continue the next audited calculation group |
| API 570 | Included, individual calculators only | Piping, Tube, Header and all eight Other Piping Calculations are connected to parity-tested typed engines and the local save/reopen/review/approval/text-report workflow; both bulk calculation tables remain excluded |
| API 653 | Included | Bottom, corrected Annular, Shell Course, Nozzle Assessment, and Roof Plate are active; Roof includes editable inspection periods, mixed units, long/short rates, allowance, and protected long-life display states; Other 4.3.2 Calculations is the final workspace |
| API 571 | Included as reference | Separate original explanatory content from source data and copyrighted text |
| Engineering tools | Included | Inventory unit converters and general tools |
| API 579 | Excluded | Do not migrate routes, assets, calculators, or reference content |

Every migrated calculator requires approved golden cases and a completed original-web verification record before being marked production-ready.

The detailed API 570 inclusion/exclusion record is maintained in `api570-mobile-scope-audit.md`. The API 653 sequence and current activation boundary are maintained in `api653-mobile-scope-audit.md`.
