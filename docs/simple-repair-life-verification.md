# Simplified after-repair remaining life
User-requested rule: use the larger soil-side long-term and short-term corrosion rates even after patches are installed. Use the lowest measured original floor thickness remaining in service after repair; do not add patch thickness or reset the inspection history.

The UI has one editable input (after-repair thickness). Minimum thickness and history rates are taken live from the existing bottom calculator. Existing top-side corrosion rate is added separately. No repair-acceptance or inspection-interval approval is issued by this estimate. Previous detailed saved assessment data is retained in formState; its measured minimum can initialize the new field.

Golden tolerance: 1e-10 years/rate in engine tests.
- 3.72 mm remaining, 2.54 mm minimum, LT 0.19, ST 1.1/2.68, top 0 => ST 0.41044776119402987 mm/year; life 2.874909090909091 years.
- Same thickness with LT 0.19 > ST 0.1 => life 6.210526315789474 years.
- At/below minimum => zero remaining life.
- Both history rates absent => incomplete; supported zero rate => no finite corrosion limit.
- Same governing rates reproduce the existing bottom-plate engine, including nonzero top-side rate.

Browser comparison uses the actual existing bottom calculator: original 6, previous 3.6, current 2.5 mm, 12 service years and 2.68 inspection years. LT 0.2916666667, ST 0.4104477612; entering 3.72 mm after repair gives 2.8749 years without changing the original result card. A lower manual UPr in the original calculator does not override the historical maximum in this section. Changing unit systems preserves the result. Report consumes the same result object. Responsive padding/alignment, light/dark, keyboard and no-overflow checks cover 390, 820 and 1440 px.
