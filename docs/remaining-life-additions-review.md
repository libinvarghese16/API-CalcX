# Remaining-life additions and display review

## Scope

The existing after-repair section is retained and titled "Remaining life after repair".
Repair-life, MFL conversion and operating-interval checks are available in 15 applicable views:

- API 510: cylindrical and spherical shells; ellipsoidal, torispherical, hemispherical, conical and flat-circular heads.
- API 570: piping, tubes and headers.
- API 653: bottom, annular, roof, shell courses and nozzles.

Calculators without a remaining-life/history basis (for example, local-thinning acceptance, pressure-only, test-pressure and weld-strength tools) do not receive a fabricated life calculation.

The addition reads each existing calculator's governing minimum and historical corrosion rates. Bottom assessments retain the separate product-side rate. Other components use their existing wall/combined corrosion-rate basis. Repair/MFL inputs remain separate from original inputs. MFL is optional percentage metal loss, not a repair cutoff.

## Preservation and persistence

- No existing calculation-engine file or engineering equation changed.
- Existing original result-card text stays identical when repair inputs change.
- Input display formatting retains the underlying full-precision state and passes raw user edits to existing handlers. Focus/blur does not round or rewrite values.
- Standard measurements/results display two decimals; corrosion rates display three. Calendar years, discrete counts and reference identifiers remain integers.
- Repair inputs are included in the existing saved calculation snapshots. Shell/nozzle scenarios use stable per-item IDs and retain independent values when changing selection or reloading.
- The separate repair report consumes the displayed result objects. Existing reports remain available.

## Layout

Input cards stack independently of the result column in one workspace. The "Additional checks" heading follows the repair input card by the normal 16 px gap, rather than waiting for the taller result column. Existing card padding, horizontal alignment, light/dark themes, keyboard access and hidden numeric spinners are preserved.

## Validation

- Full suite: 101 app tests and 236 engine tests passed (337 total).
- TypeScript strict checks and production build passed.
- Browser harness checked the 16 date-enabled views and repair additions in all 15 applicable views.
- Saved and reloaded repair input 20.123456 across all 15 views: stored value unchanged, display 20.12.
- Confirmed independent shell/nozzle selections and unchanged original result cards.
- Confirmed raw corrosion input 0.1234567 displays 0.123 without changing stored precision, including after focus/blur.
- Checked MFL conversion, invalid/blank inputs, interval results, actual report download, and manual-vs-history rate behavior.
- Checked 390, 820 and 1440 px widths in light/dark mode: matching card padding, no page overflow, and gaps no greater than 20 px.
- Existing golden engine tolerance remains 1e-10 for repair/MFL/interval arithmetic. Display precision is intentionally lower.
