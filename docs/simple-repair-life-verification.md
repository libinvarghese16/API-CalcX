# Simplified after-repair remaining life
User-requested rule: use the larger soil-side long-term and short-term corrosion rates even after patches are installed. Use the lowest measured original floor thickness remaining in service after repair; do not add patch thickness or reset the inspection history.

The UI accepts after-repair thickness (or optional MFL metal loss) and a requested operating interval. Minimum thickness and history rates are taken live from the existing bottom calculator. Existing top-side corrosion rate is added separately. No repair-acceptance or inspection-interval approval is issued by this estimate. Previous detailed saved assessment data is retained in formState; its measured minimum can initialize the new field.

Golden tolerance: 1e-10 years/rate in engine tests.
- 3.72 mm remaining, 2.54 mm minimum, LT 0.19, ST 1.1/2.68, top 0 => ST 0.41044776119402987 mm/year; life 2.874909090909091 years.
- Same thickness with LT 0.19 > ST 0.1 => life 6.210526315789474 years.
- At/below minimum => zero remaining life.
- Both history rates absent => incomplete; supported zero rate => no finite corrosion limit.
- Same governing rates reproduce the existing bottom-plate engine, including nonzero top-side rate.

Browser comparison uses the actual existing bottom calculator: original 6, previous 3.6, current 2.5 mm, 12 service years and 2.68 inspection years. LT 0.2916666667, ST 0.4104477612; entering 3.72 mm after repair gives 2.8749 years without changing the original result card. A lower manual UPr in the original calculator does not override the historical maximum in this section. Changing unit systems preserves the result. Report consumes the same result object. Responsive padding/alignment, light/dark, keyboard and no-overflow checks cover 390, 820 and 1440 px.

## MFL and interval extension

- MFL is explicitly percentage metal loss: lost mm = original mm × loss% / 100; remaining mm = original mm − lost mm. The original thickness is read from the existing calculator in SI. A repair cutoff is not treated as a measurement.
- With MFL enabled, converted remaining thickness feeds the same life calculation without changing history rates. Turning it off restores the previous manual thickness. Percent values outside 0–100 or missing inputs are blocked; 100% loss produces zero remaining life.
- Required current thickness = minimum + years × (max(long-term, short-term) + product-side rate). This can be calculated even before a current thickness is entered.
- Golden case (tolerance 1e-10): original 6 mm, 38% loss → 2.28 mm lost / 3.72 mm remaining. At ST 1.1/2.68, top 0, minimum 2.54, six years requires 5.002686567164179 mm; 3.72 mm projects to 1.257313432835821 mm.
- An inverse check against the existing bottom engine returns projected MRT 2.54 mm when starting at the calculated required thickness, including a nonzero top-side rate.
- Browser checks verify report parity, MFL toggle restoration and invalid inputs, always-visible section, original result preservation, matching shared layout and a maximum 20 px gap to the new heading. Global numeric input spinners are hidden; number validation and typed input remain.
