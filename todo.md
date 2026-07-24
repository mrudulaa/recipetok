- [ ] Audit Phase 2 screens against wireframes and fix remaining layout, spacing, bottom-sheet, and interaction mismatches
- [ ] Align planner bottom sheets with wireframes, including correct anchoring, dynamic height, and content spacing
- [ ] Cross-check home, AI chat, AI swap, cadence, and AI planner screens against mocks and fix discrepancies

- [x] Calculate accurate per-serving breakdown for High Protein Pasta (ZTA61WASC) recipe
- [x] Fix extraction: remove duplicate ingredients (Palmini Noodles + Pasta both listed)
- [x] Fix extraction: exclude side dishes (Caesar salad kit) from main recipe nutrition
- [x] Fix extraction: improve nutrition estimates with realistic per-ingredient values

- [x] Multi-part recipes: add part/component field to ingredients (main, side, sauce)
- [x] Multi-part recipes: update extraction prompt to group ingredients into parts
- [x] Multi-part recipes: recipe detail UI shows per-part sections with subtotal macros
- [x] Multi-part recipes: independent serving scaling per part
- [x] Swaps: show calorie/macro delta clearly on swap options

- [x] Remove top-level serving scaler for multi-part recipes (per-part scalers drive everything)
- [x] Add inline ingredient quantity editing (tap amount to edit, trash to remove)
- [x] Fix macro pills to be pure sum of per-part scaled totals (no stale recipe.total_* for multi-part)

- [ ] Add is_public column to recipes table (DB migration needed)
- [ ] Create public recipe page at /r/[id] (no auth required)
- [ ] Add share button to recipe detail page (native share sheet + copy link)
