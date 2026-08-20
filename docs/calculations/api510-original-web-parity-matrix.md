# API 510 original-web parity matrix

Status: current API 510 geometry set rechecked against the protected original website on 13 August 2026.

## Controlled shared basis

Unless a geometry row states otherwise, the comparison used `P = 1.5 MPa`, `S = 138 MPa`, `E = 0.85`, `t original = 18 mm`, `t previous = 16.5 mm`, `t actual = 15.8 mm`, build year `2006`, previous inspection year `2021`, and next interval `5 years`. The protected original website and the mobile application were run locally. No production source file was changed.

| Geometry | Geometry input | Original required thickness | Engine required thickness | Original governing MAWP | Engine governing MAWP | Original future MAWP | Engine future MAWP | Status |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| Cylindrical shell | `Di = 2000 mm` | 12.89 mm | 12.89 mm | 1.836 MPa | 1.836 MPa | 1.675 MPa | 1.675 MPa | Pass |
| Spherical shell | `Di = 2000 mm` | 12.89 mm | 12.89 mm | 1.836 MPa | 1.836 MPa | 1.675 MPa | 1.675 MPa | Pass |
| Ellipsoidal head | `Di = 2000 mm` | 12.80 mm | 12.80 mm | 1.850 MPa | 1.850 MPa | 1.687 MPa | 1.687 MPa | Pass |
| Torispherical head | `L = 2000 mm` | 22.66 mm | 22.66 mm | 1.046 MPa | 1.046 MPa | 0.954 MPa | 0.954 MPa | Pass |
| Hemispherical head | `L = 1000 mm` | 6.40 mm | 6.40 mm | 3.695 MPa | 3.695 MPa | 3.369 MPa | 3.369 MPa | Pass |
| Conical head | `Do = 2000 mm`, `alpha = 30 degrees` | 14.88 mm | 14.88 mm | 1.592 MPa | 1.592 MPa | 1.452 MPa | 1.452 MPa | Pass |
| Flat circular head | `d = 200 mm`, `C = 0.3` | 12.39 mm | 12.39 mm | 2.440 MPa | 2.440 MPa | 2.027 MPa | 2.027 MPa | Pass |

All seven rows also matched the protected original website for long-term corrosion rate `0.110 mm/yr`, short-term and governing corrosion rate `0.140 mm/yr`, projected thickness `15.10 mm`, and future-MAWP thickness `14.40 mm`.

The original website rounds its auto-filled minimum-thickness input before reading it back into corrosion allowance and remaining life. The engine intentionally retains full equation precision until output formatting. This known presentation round-trip is accepted only within the recorded tolerances: 0.005 mm for displayed length, 0.0005 MPa for displayed pressure, 0.0005 mm/yr for displayed corrosion rate, and 0.05 year for remaining life. Any difference outside these limits blocks the update.

## Permanent gate

Every future calculation update must complete the process in `original-web-verification-gate.md`: protected source audit, identical controlled original-site run, raw golden regression with an explicit tolerance, mobile comparison, unit-system round trip, and full local validation. A row cannot be marked complete from formula inspection alone.

The practical mixed-input-unit adapter was separately rechecked with pressure entered as `15 Bar`; see `api510-mixed-input-units-parity.md` for the protected-source factors, controlled results, persistence check, and recorded tolerances.
