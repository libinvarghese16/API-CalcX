# API 510 mixed-input-unit parity

Status: implemented and locally verified on 13 August 2026.

## Protected original source audited

The input adapter uses the same practical-unit definitions as the protected original `scripts.js` source:

- short length: `mm`, `cm`, `m`, `in`, `ft`, normalized to `mm`;
- pressure and stress: `kPa`, `MPa`, `Bar`, `psi`, normalized to `MPa`;
- temperature: `C`, `F`, normalized to `°C`.

The preserved conversion factors are `10 mm/cm`, `1000 mm/m`, `25.4 mm/in`, `304.8 mm/ft`, `0.001 MPa/kPa`, `0.1 MPa/Bar`, and `145.0377377 psi/MPa`. Fahrenheit uses `(F - 32) / 1.8` to reach Celsius.

The global Unit system remains the result and default-input basis. Each field selector can override its input unit. Every selected value is converted to the engine's MPa/mm/°C basis before geometry, corrosion, remaining-life, MAWP, projection, or test-pressure calculations run. Changing a field selector live-converts the displayed value without changing its physical quantity. Changing the global Unit system converts all unit-bearing fields to that system's defaults and changes result presentation only.

## Controlled original-site comparison

The cylindrical-shell parity basis was rerun with internal pressure entered as `15 Bar`, equivalent to `1.5 MPa`. All other values used the shared parity basis in `api510-original-web-parity-matrix.md`.

| Result | Protected original site | New mobile workflow | Status |
| --- | ---: | ---: | --- |
| Required thickness | 12.89 mm | 12.89 mm | Pass |
| Governing MAWP | 1.836 MPa | 1.836 MPa | Pass |
| Long-term corrosion rate | 0.110 mm/yr | 0.110 mm/yr | Pass |
| Short-term corrosion rate | 0.140 mm/yr | 0.140 mm/yr | Pass |
| Remaining life | 20.79 yr | 20.8 yr | Pass at display precision |
| Future MAWP | 1.675 MPa | 1.675 MPa | Pass |

The same normalized result was then displayed under the U.S. global basis as required thickness `0.507 in`, governing MAWP `266.3 psi`, long-term rate `0.0043 in/yr`, short-term rate `0.0055 in/yr`, and future MAWP `242.9 psi`.

## Regression and acceptance tolerance

Four additional calculation tests cover the protected practical-unit factors, length conversions, physical-value preservation during live unit changes, and supported-unit/default lists. Conversion functions use a raw numerical tolerance of `1e-12` where the decimal factor is exact and `1e-9` where the protected `psi/MPa` factor is involved. The interface comparison retains the permanent API 510 tolerances: `0.005 mm` displayed length, `0.0005 MPa` displayed pressure, `0.0005 mm/yr` displayed corrosion rate, and `0.05 year` remaining life.

The mixed input units were also saved to the local project record, the page was refreshed, and the record was reopened with `Bar`, `in`, and `°F` field selections intact.
