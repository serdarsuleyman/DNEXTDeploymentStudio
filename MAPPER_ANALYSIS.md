# Mapper Rules — UI & Architecture Analysis & Implementation Plan (`MAPPER_ANALYSIS.md`)

**Date:** 2026-11-24  
**Scope:** Full analysis of DNEXT Mapper `BasicRule`s (`category: ["mapperRules"]`, ~23,857–30,000 rules in the live system, example `MAPPER_accesses1`), the updated `vfde_catalog_reference.db` staging tables (`STG_FN_MAPPER_*`), existing Rules UI & cache gaps, and the concrete implementation plan for a **separate Left-Pane Mapper Rules screen** with **differentiated big-data sync** and **full Create / Edit / Push**.

**Primary Sources:**
- [`specs/Mapper_ANalysis.pptx`](specs/Mapper_ANalysis.pptx) (13 slides)
- [`reference_data/2_reference_db/vfde_catalog_reference.db`](reference_data/2_reference_db/vfde_catalog_reference.db) (`STG_FN_MAPPER_ATTRIBUTE`, `STG_FN_MAPPER_SIMPLE_PRODUCT`, `STG_RULE_ID_SIMPLE_COND_LK`, `STG_RULES_FACT_DESCRIPTOR`)
- Backend: [`backend/routes/rules.js`](backend/routes/rules.js), [`backend/services/db.js`](backend/services/db.js), [`backend/routes/catalogReference.js`](backend/routes/catalogReference.js)
- Frontend: [`App.jsx`](frontend/src/App.jsx), [`areas.js`](frontend/src/components/shell/areas.js), [`AppRail.jsx`](frontend/src/components/shell/AppRail.jsx), [`DnextRuleEngineView.jsx`](frontend/src/components/rule-engine/DnextRuleEngineView.jsx), [`RulesListView.jsx`](frontend/src/components/rule-engine/RulesListView.jsx), [`RuleDetailDrawer.jsx`](frontend/src/components/rule-engine/RuleDetailDrawer.jsx)

---

## 1. Executive Summary

- Mapper Rules are identified by `category: ["mapperRules"]` (e.g., `MAPPER_accesses1`, `MAPPER_sales_package10`).
- They represent ~30,000 rules in the live DNEXT Rule Engine (`drule-api`), whereas the local `dnext_catalog_cache` currently holds only `382`–`383` Compatibility/Sales rules.
- Because of the 100× scale difference and completely different semantics (`direction`, `mapper_type`, `AttributeCode`/`Value`/`AdditionalValue`, `managedAssetGroup.entity[]` SKU references, `result: "true"`), Mapper Rules require:
  1. A **separate left-pane navigation screen** (`Mapper Rules`, `#/mapper-rules`) in [`AppRail.jsx`](frontend/src/components/shell/AppRail.jsx) & [`areas.js`](frontend/src/components/shell/areas.js).
  2. A **differentiated, throttled, category-scoped sync & normalized SQLite storage** (`dnext_mapper_rules` + `dnext_mapper_rule_skus`) that never pollutes the `383`-rule `dnext_catalog_cache` blob.
  3. **Full Create / Edit / Push** to `drule-api` (note: existing `POST`/`PATCH`/`DELETE` in [`backend/routes/rules.js`](backend/routes/rules.js) only mutate local JSON/cache and do not push to `druleBaseUrl`).

---

## 2. Analysis of `vfde_catalog_reference.db` (`STG_FN_MAPPER_*` & Rule Staging Tables)

The updated [`reference_data/2_reference_db/vfde_catalog_reference.db`](reference_data/2_reference_db/vfde_catalog_reference.db) contains four tables directly relevant to Mapper Rules:

### 2.1 `STG_FN_MAPPER_ATTRIBUTE` (`23,857` rows)
Holds one row per unique deduplicated Mapper attribute (`attribute_id` → `BasicRule.id = "MAPPER_" + attribute_id`):

| Column | Type | Notes & Observed Values |
| :--- | :--- | :--- |
| `attribute_id` | `TEXT PRIMARY KEY` | e.g., `accesses1`, `sales_package1` |
| `mapper_type` | `TEXT NOT NULL` | 11 functional areas (`internet`, `voice`, `hardware`, `sales_package`, `accesses`, `safetyPackage`, `SecureNet`, `SuperWlan`, `TV`, `directoryEntry`, `winback`) |
| `direction` | `TEXT` | `out` (Cart → Multimapper → OGW) or `in` (`GetCustDetail-Resp` → Multimapper → 360° View) |
| `basket_action` | `TEXT` | `change`, `keep`, `add`, `remove`, or `NULL` (always `NULL` for `in`) |
| `attribute_action` | `TEXT` | `overwrite`, `add`, `takeover`, or `NULL` (always `NULL` for `in`) |
| `attribute_code` | `TEXT` | e.g., `accessSupplier`, `refFunctionID`, `GenerateContract` |
| `attribute_value` | `TEXT` | e.g., `OXGG`, `FUNCI-001`, `true` |
| `attribute_additional_value` | `TEXT` | Target/source path, e.g., `/accesses/ipBitstream/ipBitstreamConfiguration/accessSupplier/existing` |
| `source_attribute_additional_value` | `TEXT` | Populated on `9,225` rows (source XML path metadata) |
| `component_element` | `TEXT` | Populated on `3` rows |
| `process_contexts` | `TEXT` | Comma-separated (`ILSBLU,MOV121,MOVBLU`) or `*` |
| `source_conditions` | `TEXT` | Raw `<SourceConditions>` XML (when conditional; `NULL` = catch-all `["true"]`) |

### 2.2 `STG_FN_MAPPER_SIMPLE_PRODUCT` (`76,302` rows)
Maps each `attribute_id` to its associated `(sku, simple_product_seq_no, element_id, ogw_component_id_reference)` occurrences (which become `managedAssetGroup.entity[]` in the `BasicRule` JSON):
- `PRIMARY KEY (mapper_type, simple_product_seq_no, sku, attribute_id)`
- Example **`MAPPER_accesses1`** (`attribute_id = 'accesses1'`):
  - **Attribute:** `mapper_type: "accesses"`, `direction: "in"`, `attribute_code: "accessSupplier"`, `attribute_value: "OXGG"`, `attribute_additional_value: "/accesses/ipBitstream/ipBitstreamConfiguration/accessSupplier/existing"`, `process_contexts: "*"`, `basket_action: null`, `attribute_action: null`, `source_conditions: null` (catch-all `condition: ["true"]`).
  - **Simple Product link:** `sku: "10041"`, `simple_product_seq_no: 1`, `element_id: "687"`, `ogw_component_id_reference: "1"`.

### 2.3 Functional Area Distribution in `STG_FN_MAPPER_ATTRIBUTE`

| `mapper_type` | `out` Rules | `in` Rules | Total |
| :--- | ---: | ---: | ---: |
| `internet` | 15,110 | 1,872 | 16,982 |
| `voice` | 2,541 | 1,157 | 3,698 |
| `hardware` | 1,666 | 789 | 2,455 |
| `sales_package` | 264 | 191 | 455 |
| `accesses` | 139 | 36 | 175 |
| `safetyPackage` | 30 | 10 | 40 |
| `SecureNet` | 16 | 3 | 19 |
| `SuperWlan` | 14 | 2 | 16 |
| `TV` | 11 | 0 | 11 |
| `directoryEntry` | 3 | 0 | 3 |
| `winback` | 3 | 0 | 3 |
| **Total** | **19,797** | **4,060** | **23,857** |

### 2.4 `STG_RULE_ID_SIMPLE_COND_LK` & `STG_RULES_FACT_DESCRIPTOR`
- `STG_RULES_FACT_DESCRIPTOR` defines **42 `mapperRules` fact entries** across 9 `mapper_type`s, collapsing to **9 distinct fact signatures** for the Mapper Condition Builder:
  - `cart.containsProductInCategoryId(string)`
  - `order.containsInstallBaseProductInCategoryId(string)`
  - `order.containsProduct(string)` / `(integer)`
  - `order.containsProductInCategoryId(string)`
  - `order.packageContainedInstalledBaseProduct(string)` / `(integer)`
  - `order.packageContainedInstalledBaseProductInCategoryId(string)`
  - `order.packageContainedInstalledBaseProductInFamily(string)`
- `STG_RULE_ID_SIMPLE_COND_LK` (`26,845` rows) stores pre-parsed atomic expressions per `rule_id` (`MAPPER_*`), useful for condition search/analytics.

---

## 3. Gap Analysis of Existing System

1. **Left-Pane Navigation ([`areas.js`](frontend/src/components/shell/areas.js), [`App.jsx`](frontend/src/App.jsx)):** Only 3 areas exist (`catalog`, `rules`, `releases`). Mapper Rules need a 4th dedicated area (`mapper-rules`).
2. **Backend Sync & Cache ([`backend/routes/rules.js`](backend/routes/rules.js), [`backend/services/db.js`](backend/services/db.js)):**
   - `GET /api/dnext/rules` defaults to `limit=1000`, uses unthrottled `Promise.all` over 100-item pages (would fire ~300 concurrent requests for 30K rules), and stores all rules as one `TEXT` JSON blob in `dnext_catalog_cache`.
   - `POST /api/dnext/rules`, `PATCH /api/dnext/rules/:id`, and `DELETE /api/dnext/rules/:id` **only write to `seedRules.json` and `dnext_catalog_cache`**—there is currently **no Push to `drule-api`**.
3. **Frontend List & Drawer ([`RulesListView.jsx`](frontend/src/components/rule-engine/RulesListView.jsx), [`RuleDetailDrawer.jsx`](frontend/src/components/rule-engine/RuleDetailDrawer.jsx)):**
   - `RulesListView` renders all rows without pagination (would freeze on 30K rows) and filters by Compatibility archetypes.
   - `RuleDetailDrawer` has zero support for `managedAssetGroup.entity[]`, `result: "true"`, or Mapper characteristics.

---

## 4. Implementation Plan

### Phase 1: Normalized SQLite Schema & Differentiated Mapper Backend
**Files:** [`backend/services/db.js`](backend/services/db.js), new `backend/routes/mapperRules.js`, [`backend/server.js`](backend/server.js) (mount route)

1. **SQLite Tables in `dnext_deployment.db`:**
   - `dnext_mapper_rules`:
     - `env_name TEXT NOT NULL`, `id TEXT NOT NULL`, `name TEXT`, `status TEXT`, `state_category TEXT`, `rule_type TEXT`
     - Indexed Mapper columns: `mapper_type TEXT`, `direction TEXT`, `attribute_code TEXT`, `attribute_value TEXT`, `attribute_additional_value TEXT`, `basket_action TEXT`, `attribute_action TEXT`, `source_component_id TEXT`, `system_name TEXT`, `process_contexts TEXT`, `sku_count INTEGER DEFAULT 0`
     - Sync/dirty tracking: `sync_state TEXT DEFAULT 'synced'` (`synced` | `modified` | `new` | `deleted`), `payload TEXT NOT NULL`, `updated_at TEXT NOT NULL`
     - `PRIMARY KEY (env_name, id)` + indexes on `(env_name, mapper_type, direction)`, `(env_name, attribute_code)`, `(env_name, status)`, `(env_name, sync_state)`.
   - `dnext_mapper_rule_skus`:
     - `env_name TEXT NOT NULL`, `rule_id TEXT NOT NULL`, `sku TEXT NOT NULL`, `block_id TEXT`
     - `PRIMARY KEY (env_name, rule_id, sku, block_id)` + index on `(env_name, sku)` for instant SKU reverse-lookup.

2. **Differentiated Big-Data Sync (`POST /api/dnext/mapper-rules/sync` & `GET /api/dnext/mapper-rules/sync/status`):**
   - Queries `${druleBaseUrl}/api/ruleEngine/v1/rule?category=mapperRules&limit=200&offset=...` (and optionally scoped by `ruleCharacteristic.name=mapper_type&ruleCharacteristic.value=...` or `direction`), using `x-total-count` from page 0.
   - Uses a **bounded worker pool (concurrency = 5)** with retry/401 token refresh, tracking live progress (`inProgress`, `fetched`, `total`, `startedAt`, `error`) in memory so the UI can poll status smoothly.
   - Wraps SQLite upserts in batched transactions (`BEGIN` / `COMMIT`) so inserting 30K rules + ~76K SKU links completes in seconds without locking.
   - Completely isolated from `GET /api/dnext/rules` (which continues to serve the ~383 Compatibility/Sales rules).

3. **Live `drule-api` SKU & Characteristic Query (`GET /api/dnext/mapper-rules/live-query`):**
   - Leverages `drule-api`'s native filter parameters:
     `?managedAssetGroup.entityType=SKU&managedAssetGroup.entity.name=<SKU>&ruleCharacteristic.name=direction&ruleCharacteristic.value=<dir>&ruleCharacteristic.name=mapper_type&ruleCharacteristic.value=<type>`
   - Enables instant **Live SKU Lookup** directly against `drule-api` even before a full 30K sync is run, and caches any returned rules into `dnext_mapper_rules` + `dnext_mapper_rule_skus`.

3. **Paginated Query, Facets & Reference Metadata APIs:**
   - `GET /api/dnext/mapper-rules`: Server-side pagination (`limit`, `offset`, `mapperType`, `direction`, `attributeAction`, `basketAction`, `processContext`, `status`, `syncState`, `q`, `sku`, `sortBy`, `sortDir`) + aggregated facet counts (`byMapperType`, `byDirection`, `byStatus`, `dirtyCount`).
   - `GET /api/dnext/mapper-rules/:id`: Returns full rule JSON + optional reference enrichment from `vfde_catalog_reference.db` (`STG_FN_MAPPER_ATTRIBUTE.source_attribute_additional_value`, `component_element`, `STG_RULES_FACT_DESCRIPTOR`).
   - `GET /api/dnext/mapper-rules/facts`: Returns the distinct `mapperRules` fact descriptors from `STG_RULES_FACT_DESCRIPTOR` for the Condition Builder.

4. **Full Create / Edit / Push Endpoints:**
   - `POST /api/dnext/mapper-rules`: Creates a new `MAPPER_*` `BasicRule` locally in `dnext_mapper_rules` (`sync_state = 'new'`) and optionally pushes immediately if `?push=true`.
   - `PATCH /api/dnext/mapper-rules/:id`: Updates an existing rule locally in `dnext_mapper_rules` and `dnext_mapper_rule_skus`, setting `sync_state = 'modified'` (preserving `'new'` if not yet pushed).
   - `POST /api/dnext/mapper-rules/:id/push`: Pushes the rule payload to `${druleBaseUrl}/api/ruleEngine/v1/rule` (`POST` if `sync_state === 'new'`, `PATCH` or `PUT` to `/api/ruleEngine/v1/rule/:id` if existing), handles 401 token refresh, and updates `sync_state = 'synced'` + `payload` from the server response.
   - `DELETE /api/dnext/mapper-rules/:id`: Supports local delete or remote `DELETE ${druleBaseUrl}/api/ruleEngine/v1/rule/:id` (`?remote=true`).

---

### Phase 2: Left-Pane Screen & Navigation
**Files:** [`frontend/src/components/shell/areas.js`](frontend/src/components/shell/areas.js), [`frontend/src/App.jsx`](frontend/src/App.jsx)

- Add `{ id: 'mapper-rules', label: 'Mapper Rules', title: 'Mapper Rules (Multimapper)', icon: 'layers', group: 'main' }` to `AREAS` in `areas.js` (hash route `#/mapper-rules`).
- Render `<DnextMapperRulesView />` in `App.jsx` when `activeArea === 'mapper-rules'`.

---

### Phase 3: Mapper Rules List & Sync Experience
**Files:** `frontend/src/components/mapper-rules/DnextMapperRulesView.jsx`, `frontend/src/components/mapper-rules/MapperRulesListView.jsx`

- **Header & Differentiated Sync Bar:**
  - Dedicated **"Sync Mapper Rules (~30K)"** button (separate from Rule Engine refresh), showing a live progress bar (`fetched / total`) during sync and cache timestamp + dirty/unpushed badge when idle.
  - **"+ New Mapper Rule"** button.
- **Faceted Filter & Search Bar:**
  - `mapper_type` functional area tabs with live SQLite counts (`All`, `internet`, `voice`, `hardware`, `sales_package`, `accesses`, `safetyPackage`, `SecureNet`, `SuperWlan`, `TV`, `directoryEntry`, `winback`).
  - `Direction` (`All` | `OUT` | `IN`), `Attribute Action`, `Basket Action`, `Status`, `Sync State` (`All` | `Modified / New`).
  - **Dual Search:** Search by Rule ID / Attribute Code / Path **or** **SKU Reverse-Lookup**.
- **Server-Paginated Table:**
  - Columns: `Rule ID`, `Functional Area`, `Direction`, `Attribute Code`, `Attribute Value`, `Path (Additional Value)`, `Actions (Basket / Attr)`, `Process Contexts`, `SKUs`, `Condition`, `Status / Sync`.
  - Pagination footer (`25` / `50` / `100` rows per page).

---

### Phase 4: Mapper Rule Detail, Authoring & Push Drawer
**File:** `frontend/src/components/mapper-rules/MapperRuleDetailDrawer.jsx`

- **Tabs:** `Visual Mapping` | `Characteristics` | `SKU Associations (managedAssetGroup)` | `Raw JSON`
- **Visual Mapping Tab:**
  - **Direction Flow Banner:** `OUT` (`Cart → Multimapper → OGW Order`) vs `IN` (`GetCustDetail-Resp → Multimapper → 360° View`) + `SystemName`, `SourceComponentID`, `mapper_type`, `Status`.
  - **Enrichment Payload Form:** Typed inputs for `AttributeCode`, `AttributeValue`, `AttributeAdditionalValue`, `BasketAction`, `AttributeAction`, `ProcessContexts` tag editor.
  - **Condition Builder:** Quantifier (`FORALL`, `FORSOME`, `IF`, or `Catch-all ["true"]`), condition expressions with `FNxxx` category resolution (`categoryResolver.js`) and fact autocomplete from `STG_RULES_FACT_DESCRIPTOR` (`mapperRules`).
- **SKU Associations Tab (`managedAssetGroup.entity[]`):**
  - Searchable, paginated table of `(SKU, blockId)` pairs (handles `1` to `217+` SKUs smoothly), with Add / Remove SKU+blockId controls.
- **Footer Actions:** **Save Draft (Local)**, **Push to DNEXT** (calls `POST /api/dnext/mapper-rules/:id/push`), and **Delete**.

---

## 5. Original Mapper XML Analysis & Reverse-Transformation Plan

*(Analysis based on `reference_data/2_reference_data/FN_Mapper_2026_08_21_17_13.xml` — excluded via `.gitignore` and **never** read at runtime by the application.)*

### 5.1 Observed XML Schema (`FN_Mapper_2026_08_21_17_13.xml`)
- **Root:** `<Components>` containing **11 `<Component>`** blocks (`SourceComponentID`, `OGWComponentName`, `SystemName: "FN"`):
  - `1`: `accesses`, `2`: `internet`, `3`: `voice`, `4`: `safetyPackage`, `5`: `hardware`, `6`: `sales package` (`mapper_type: sales_package`), `7`: `TV`, `9`: `directoryEntry`, `10`: `SecureNet`, `12`: `winback`, `14`: `SuperWlan`.
- **`<SimpleProduct>` (`10,328` blocks):** `<ElementId>`, `<OGWComponentIdReference>`, `<SKU>`, and 1..N `<Attribute>` children.
- **`<Attribute>` (`76,412` blocks):**
  - `<BasketAction>` (optional, `65,879` occurrences)
  - `<AttributeCode>` (`76,412`)
  - `<AttributeValue>` (optional, `66,709`)
  - `<AttributeAdditionalValue>` (`76,412`)
  - `<SourceAttributeAdditionalValue>` (optional, `9,703`)
  - `<ComponentElement>` (optional, `3`)
  - `<Direction>` (`76,412` — `out` / `in`)
  - `<AttributeAction>` (optional, `66,215`)
  - `<ProcessContexts>` → `<ProcessContext>...</ProcessContext>` (`76,412`)
  - `<SourceConditions>` (optional, `54,160` — omitted for catch-all `["true"]`)
- **`<SourceConditions>`:** Recursive structure with `<Aggregator>` (`all`: 52,541 / `any`: 17,516), `<ConditionValue>`, `<ConditionName>`, and `<SourceCondition>` (`<Type>`, `<Params><Param name="...">`, `<Operator>` [`is`: 126,932 / `is not`: 33], `<ConditionValue>`).

### 5.2 Plan: Auto-Generated "Original Mapper XML" Tab (Purely from DNEXT Data)
1. **Create `frontend/src/utils/mapperXmlGenerator.js`:**
   - Pure function `generateOriginalMapperXml(rule, options)` that reconstructs the original XML **solely from the DNEXT `BasicRule` JSON** (`ruleCharacteristic[]`, `managedAssetGroup.entity[]`, `ruleType`, `condition[]`, `id`):
     - Maps `source_component_id` + `mapper_type` → `<SourceComponentID>`, `<OGWComponentName>` (`sales_package` → `sales package`), `<SystemName>`.
     - Maps `managedAssetGroup.entity[]` → `<SimpleProduct>` blocks (`<ElementId>` from `blockId`, `<OGWComponentIdReference>` from `source_component_id`, `<SKU>` from `name`), with an option to render a single selected SKU or all SKUs (capped/paginated for 200+ SKU rules).
     - Maps `ruleCharacteristic[]` → `<Attribute>` children (`<BasketAction>`, `<AttributeCode>`, `<AttributeValue>`, `<AttributeAdditionalValue>`, `<SourceAttributeAdditionalValue>`, `<ComponentElement>`, `<Direction>`, `<AttributeAction>`, `<ProcessContexts>`).
     - Recursively parses `ruleType` + `condition[]` (`&&`, `||`, `( ... )`, `!`, `fact.op(args)`) back into `<SourceConditions>` XML (omitting `<SourceConditions>` when `condition` is `["true"]`).
2. **Add Tab to `MapperRuleDetailDrawer.jsx`:**
   - Add **`Original Mapper XML`** tab alongside `Visual Mapping`, `SKU Associations`, `Characteristics`, and `Raw JSON`.
   - Include a mode toggle (**Selected SKU / First SKU** vs **All SKUs**), **Copy XML**, and **Download `.xml`** actions.
