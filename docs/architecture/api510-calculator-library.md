# API 510 calculator library

Status: all seven validated geometry entries activated in the local mobile/web preview on 13 August 2026.

## Scope

The calculation library now provides direct entries for:

1. Cylindrical shell.
2. Spherical shell.
3. Ellipsoidal head.
4. Torispherical head.
5. Hemispherical head.
6. Conical head.
7. Flat circular head.

This milestone is navigation and presentation only. It does not change an engineering equation, result rule, unit conversion, material lookup or dropdown dependency.

## Shared workflow

Every library entry presets the `PressureVesselComponent` on the existing API 510 workspace. The same component state selects the already-validated calculation-engine function, geometry-specific input fields, structured result, local project record, review dialog and report model.

| Library entry | Engine identity | Additional geometry input |
| --- | --- | --- |
| Cylindrical shell | `api510.cylindrical-shell` | Inside diameter |
| Spherical shell | `api510.spherical-shell` | Inside diameter |
| Ellipsoidal head | `api510.ellipsoidal-head` | Inside diameter; 2:1 basis |
| Torispherical head | `api510.torispherical-head` | Inside diameter and inside crown radius |
| Hemispherical head | `api510.hemispherical-head` | Inside diameter and inside spherical radius |
| Conical head | `api510.conical-head` | Outside diameter and cone half-apex angle |
| Flat circular head | `api510.flat-circular-head` | Diameter/short span and attachment factor C |

Users may still change Component inside a new unsaved calculation. Saved calculations always reopen using their stored component and are not replaced by the most recently selected library preset.

## Search behavior

The shared calculator search also filters the seven geometry entries using their titles, descriptions, geometry inputs and practical aliases such as sphere, crown radius, half apex and attachment factor.

## Verification

Registry tests prove there are exactly seven unique component presets and engine identities, verify every component-to-engine mapping and cover practical geometry search aliases. Browser validation opens each library entry and confirms the expected heading, selected component, geometry fields and live engine identity. The unchanged 45-test API 510 regression suite remains the numerical acceptance gate.
