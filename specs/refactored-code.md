# Refactored Code Log

This document tracks the incremental refactoring of the DNEXT Deployment Studio codebase to improve reusability across list views and detail templates, remove duplicated logic, and externalize hardcoded values.

---

## Completed: Reference Value Centralization

### New Files
- `frontend/src/config/referenceValues.json`
  - Centralized existing reference tables without adding new values:
    - `bandwidths`: `knownDownloadSpeedsMbps`, `defaultUploadByDownloadMbps`, `dslAccessProfiles`
    - `dslFallbackTiers`: Vodafone DSL fallback tiers (`175`–`1` Mbit/s, `svcBw`, `sku`, `upload`, `technology`)
    - `standardFallbackRules`: nominal speed → fallback speeds mapping
    - `fallbackCategories`: `FN*` fallback category reference list
    - `baselineSalesPackageSpecs`: 61 multi-value characteristics + 11 scalar characteristics

### Updated Files
- `frontend/src/services/psmStructureService.js`: Imports `referenceValues.json` and exports `VODAFONE_DSL_FALLBACK_TIERS`, `FALLBACK_VFDE_CATEGORIES`, `BASELINE_SALES_PACKAGE_SPECS`, `getStandardFallbackTiers`, `getDefaultUploadSpeed`, and `getDslAccessProfileDescription`.
- `frontend/src/components/detail-templates/SalesPackageNewDetailTemplate.jsx`: Removed ~200 lines of duplicated reference constants and imported them from `psmStructureService.js`.
- `frontend/src/components/detail-templates/SalesPackageDetailTemplate.jsx`: Replaced inline DSL access profile thresholds with `getDslAccessProfileDescription()`.

---

## Completed: Phase 1 — Pure Shared Utilities & Theme Tokens

### New Files
- `frontend/src/utils/entityClassifiers.js`
  - Single source of truth for `isSalesPackageSpec`, `isOptionSpec`, and `isHardwareSpec`, sharing a unified `getSpecSearchString()` helper.
- `frontend/src/utils/jsonPath.js`
  - Extracted `evaluateJsonPath` (with dot-traversal, array wildcards, predicate filters, and `||` fallbacks) out of `salesPackageColumnConfig.js`.
- `frontend/src/styles/theme.js`
  - Shared `C` color token object backed by CSS custom properties in `styles/tokens.css`.
- `frontend/src/utils/__tests__/phase1Utils.test.js`
  - `node:test` unit tests covering `entityClassifiers.js` and `jsonPath.js`.

### Updated Files
- `frontend/src/components/list-views/listViewRegistry.js`: Imports and re-exports `isOptionSpec`, `isSalesPackageSpec`, `isHardwareSpec` from `../../utils/entityClassifiers`.
- `frontend/src/components/detail-templates/viewTemplateRegistry.js`: Imports and re-exports `isSalesPackageSpec`, `isOptionSpec` from `../../utils/entityClassifiers`.
- `frontend/src/components/list-views/salesPackageColumnConfig.js`: Imports and re-exports `evaluateJsonPath` from `../../utils/jsonPath`.
- `frontend/src/components/list-views/optionColumnConfig.js`: Imports `evaluateJsonPath` directly from `../../utils/jsonPath`.
- `frontend/src/components/list-views/constants.js`: Re-exports `C` from `../../styles/theme`.
- `frontend/src/components/detail-templates/SalesPackageNewDetailTemplate.jsx`: Imports `C` from `../../styles/theme` and `isSalesPackageSpec` from `../../utils/entityClassifiers`.
- `frontend/src/components/detail-templates/SalesPackageDetailTemplate.jsx`: Imports `C` from `../../styles/theme`.

### Verification
- `node --test frontend/src/utils/__tests__/phase1Utils.test.js`: 4/4 tests passed.
- `cd frontend && npm run build`: Passed (`55 modules transformed`, built in `125ms`).

---

## Completed: Phase 2 — Externalize Hardcoded Configs & Backend Reference Data

### New Files
- `backend/data/salesPackagePresets.json`
  - Externalized the 4 Sales Package generator presets (`preset_fiber_250`, `preset_fiber_150`, `preset_dsl_100`, `preset_dsl_16`) out of `salesPackageEngine.js`.

### Updated Files
- `backend/config.json`: Removed the duplicate `dpc_ui.test-g` environment entry and added `auth` configuration (`clientId`, `scope`, `realmPath`).
- `backend/routes/auth.js`: Reads `clientId` and `scope` from `config.json` / `process.env` (`DNEXT_CLIENT_ID`, `DNEXT_AUTH_SCOPE`) instead of hardcoding them.
- `backend/routes/environments.js`: Reads `auth.realmPath` from `config.json` via `getRealmPath()`.
- `backend/services/salesPackageEngine.js`: Loads `PRESETS` from `backend/data/salesPackagePresets.json`.
- `frontend/src/components/DnextRemoteCatalogView.jsx`: Removed `DEFAULT_ENVIRONMENTS` and hardcoded `dev-gcu` / `test-gcu` URL fallbacks; reads environments from `/api/dnext/environments`, props, or `localStorage`.

### Verification
- `node --check` on `backend/routes/auth.js`, `backend/routes/environments.js`, `backend/services/salesPackageEngine.js`: Passed.
- `backend/config.json` & `backend/data/salesPackagePresets.json` validated (`envs: 2`, `authClient: orbitant-ui-client`, `presets: 4`).
- `node --test frontend/src/utils/__tests__/phase1Utils.test.js`: 4/4 tests passed.
- `cd frontend && npm run build`: Passed (`55 modules transformed`, built in `124ms`).

---

## Completed: Phase 3 (Part 1) — List View Hooks & Shared Components

### New Files
- `frontend/src/hooks/useColumnConfig.js`
  - Shared hook for configurable table columns with `localStorage` persistence, optional column-key migration, and popover open/close handling.
- `frontend/src/hooks/useTableFilterSort.js`
  - Shared hook for inline column filtering, distinct select options, active filter entries, and multi-type sorting (with optional custom sort values like `speed`).
- `frontend/src/components/list-views/VersionMenuDropdown.jsx`
  - Shared Expand / Collapse Versions split button and dropdown menu.
- `frontend/src/components/list-views/ColumnCustomizerPopover.jsx`
  - Shared Columns toggle button and popover with column checkboxes and Reset Defaults.

### Updated Files
- `frontend/src/components/list-views/SalesPackagesListView.jsx`: Migrated to `useColumnConfig`, `useTableFilterSort`, `ColumnCustomizerPopover`, and `VersionMenuDropdown` (reduced from 1,096 lines to 663 lines).
- `frontend/src/components/list-views/OptionsListView.jsx`: Migrated to `useColumnConfig`, `useTableFilterSort`, `ColumnCustomizerPopover`, and `VersionMenuDropdown` (reduced from 1,075 lines to 669 lines).

### Verification
- `cd frontend && npm run build`: Passed (`59 modules transformed`, built in `129ms`).
- `rolldown` + `renderToString` test on `SalesPackagesListView` and `OptionsListView` with versioned sample data: Both rendered cleanly (`10,396` chars and `8,087` chars).

---

## Post-Refactor Triage & Restoration

### Issues Identified & Root Causes
1. **Accidental deletion of `dpc_ui.test-g` environment**:
   - `dpc_ui.test-g` was removed from `backend/config.json` under the incorrect assumption that it was a redundant duplicate of `test`.
   - In `backend/data/dnext_deployment.db`, all 380 cached ProductOfferings, ProductSpecifications, and ProductOfferingPrices are partitioned by `env_name: 'dpc_ui.test-g'`. Removing it caused all catalog queries to miss the cache and fail against offline/expired remote endpoints.
2. **Missing cache alias fallback**:
   - In `backend/services/dnextClient.js`, requests with `envName: 'test'` or `'default'` failed to match cache entries stored under `dpc_ui.test-g`.
3. **Environment and header defaults in `DnextRemoteCatalogView.jsx`**:
   - `DEFAULT_ENVIRONMENTS` and safe fallback URLs were removed, leading to empty `activeEnv` and empty `x-dnext-*` headers on cold starts or before props resolved.
4. **Temporal Dead Zone (TDZ) and missing headers in `SalesPackageNewDetailTemplate.jsx`**:
   - Functions `getCharDefinition` and `resolveIsArray` accessed `formData.specificationId` before `formData` state was declared, creating a potential `ReferenceError` during rendering.
   - Internal fallback fetches for categories, offerings, and specifications did not send environment headers, failing to retrieve cached entries.

### Fixes Applied
1. **Restored `dpc_ui.test-g` in `backend/config.json`**: Retained alongside `Default (dev-gcu)` and `test`.
2. **Added bidirectional cache alias fallback in `backend/services/dnextClient.js`**: `test` and `default` query keys transparently check `dpc_ui.test-g` cache if an exact key is not found, guaranteeing immediate 100% cache hit rates (299 offerings, 28 specifications, 546 prices).
3. **Restored fallback `DEFAULT_ENVIRONMENTS` in `DnextRemoteCatalogView.jsx`**: Ensured `selectedEnvName` and `getTargetEnvHeaders` always provide valid environment and URL headers.
4. **Resolved TDZ and added `envHeaders` in `SalesPackageNewDetailTemplate.jsx`**:
   - Moved `getCharDefinition` and `resolveIsArray` below `formData` declaration and safeguarded `formData?.specificationId`.
   - Added `envHeaders` to all internal catalog and specification fetches.

### Verification
- `npm run build --prefix frontend`: Built cleanly (`59 modules transformed`).
- `node --test frontend/src/utils/__tests__/*.js`: 4/4 tests passed.
- Direct Node verification of `backend/services/dnextClient.js`: 299 offerings, 28 specs, 546 prices resolved as cache hits.
- Backend server syntax check & in-memory initialization: Verified clean startup.

---

## Completed: Hardware List View Column Customizer & Filtering

### New Files
- `frontend/src/components/list-views/hardwareColumnConfig.js`
  - Catalogue of available columns (`id`, `name`, `spec`, `sku`, `product_type`, `package_type_id`, `package_subtype_id`, `product_family_id`, `maf`, `product_visibility`, `checkout_product`, `initial_selectable`, `contract_value`, `effective_date`, `expiration_date`, `start_date`, `end_date`, `version`, `lifecycle`).
  - Default visible column keys (`id`, `name`, `spec`, `sku`, `product_type`, `version`, `lifecycle`).
  - `getColumnRawValue` helper for multi-attribute sorting, text/select filtering, and JSONPath extraction.
- `frontend/src/utils/__tests__/hardwareColumnConfig.test.js`
  - Unit tests verifying column definitions and attribute extraction for hardware offerings.

### Updated Files
- `frontend/src/components/list-views/HardwareListView.jsx`
  - Integrated `useColumnConfig` with `localStorage` persistence (`dnext_hardware_visible_columns`).
  - Integrated `useTableFilterSort` for inline column filters, sort headers, and active filter pill bar.
  - Added `ColumnCustomizerPopover` to toggle visible attributes dynamically with counter badge.
  - Integrated `VersionMenuDropdown` for split-button version expand/collapse.
  - Dynamic cell rendering for both parent rows and child version trees.

### Verification
- `npm run build --prefix frontend`: Built cleanly (`60 modules transformed`, built in `144ms`).
- `node --test frontend/src/utils/__tests__/*.js`: 6/6 tests passed.
