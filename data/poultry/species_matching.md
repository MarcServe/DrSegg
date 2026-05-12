# Species authoring → `cases.animal_type` matching

[`matchConditions`](/Users/morgees/Dr Segira/src/lib/ai/knowledge-match.ts): a row passes the filter iff `knowledge_conditions.species[]` overlaps `animal.toLowerCase()` **or** includes `'all'` (also matches capitalizations case-insensitive).

[`new-case` UI](/Users/morgees/Dr Segira/src/app/new-case/page.tsx) offers **`poultry` | `goat` | `pig` | `dog`** only — there is **no** separate turkey / duck / quail picker today.

Therefore every poultry-side condition row authored with YAML tokens such as `broiler`, `layer`, `turkey`, `duck`, `quail`, `pheasant`, `goose`, `gosling`, `chick`, `chicks`, `chicken`, **must persist at least `poultry` or `all`** in the Postgres `species` array or it will never match poultry cases.

- Keep fine-grained taxon/production labels (`layer`, `broiler`) in **`clinical_intelligence`** metadata for future `cases.subtype` UX.
- When `cases.subtype` lands, narrowing filter happens in TS or RPC — not required for current release.
