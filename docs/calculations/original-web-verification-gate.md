# Original-web calculation verification gate

Status: mandatory for every calculation engine addition or equation-related change.

## Required evidence before an update is complete

1. Identify the protected original-web terminal calculation function, every upstream automatic derivation or selection function, and all geometry-specific fields.
2. Build an explicit dependency map from entered inputs through derived values and automatic selections to the final result. A source-calculated value must not be replaced by a manual-only field.
3. Record the exact original-web equations, table-selection branches, validation limits, defaulting rules, interval normalization, and unit basis.
4. For every automatic field that also permits editing, verify the automatic golden case, highlighted manual override, return to automatic mode, basis-input changes, and unavailable or out-of-range behavior.
5. Run one controlled SI input set in the original website and record every displayed result used by the new workflow.
6. Use the same input set as a typed-engine golden regression case with an explicit numerical tolerance.
7. Run the controlled input set in the new mobile workflow and compare its displayed values with the original website at the display precision of each interface.
8. Verify Metric and U.S. customary conversion without changing the SI result object.
9. Confirm the protected source-baseline check, material-catalog check, automated tests, TypeScript check, production build, phone-width layout, and browser console.

## Required comparison outputs

- Required or minimum thickness
- Current MAWP and any governing case
- Long-term, short-term, and governing corrosion rates
- Corrosion allowance and remaining life
- Projected thickness
- Future-MAWP thickness and future MAWP
- Hydrostatic and pneumatic planning multipliers when present
- Course elevation, hydrostatic test height, and operating fill height when present

## Acceptance rule

The new engine must match the original website within the regression tolerance before the component is marked complete. Any omitted upstream automatic dependency, selection branch, or editable automatic field keeps the component **in progress**, even if its terminal equation matches. Any difference must be investigated and documented; it must not be silently normalized, rounded, or corrected. Engineering confirmation against the owner's controlled standard edition remains a separate approval step.
