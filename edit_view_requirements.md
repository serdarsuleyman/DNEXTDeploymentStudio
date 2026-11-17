# DNEXT Product Catalog - Entity Edit View Requirements

This document captures all user requirements and design specifications requested for the **Entity Edit View** (specifically focused on the **Option Detail View** as the baseline, with principles applicable across all catalog entities).

---

## 1. Scope & View Isolation
- **Option Detail View Scope**: All edit capabilities are scoped and applied specifically to the **Option Detail View** (`StandardOfferingDetailTemplate` when `isOption && isEditing`) without altering or breaking other views unexpectedly.
- **Dedicated Edit Mode State**: Entering edit mode is explicitly triggered via the `[✏️ Edit Option]` button in the drawer header and canceled via `[Cancel]` without lingering side-effects.

---

## 2. Core Invariants: Immutable Name & ID Fields
*(Aligned with `agent.md` Catalog Rules)*
- **Non-Editable Name**: In the Edit Mode of any entity, the `name` field **must not be editable**. It is locked with a visual lock indicator (`🔒 Locked`).
- **Non-Editable ID**: In the Edit Mode of any entity, the `id` field **must not be editable**. It is locked with a visual lock indicator (`🔒`).
- **Catalog Rule**: `ID` and `Name` fields are strictly unique and immutable in the DNEXT Product Catalog.

---

## 3. Version Progression on Edit (New Version Creation)
- **Automatic Version Increment**: When clicking Edit Mode, the dialog starts updating a **new version** of the offer.
  - If current version is `1` (or integer `N`), the new version defaults to `N + 1` (e.g. `1` → `2`).
  - If current version has dot-notation `X.Y` (e.g. `1.0`), the new version defaults to `X.(Y + 1)` (e.g. `1.0` → `1.1` or `2.0`).
- **Visual Version Indicators**:
  - Top Active Edit Banner explicitly states: `Updating Option Offering · ★ New Version: v{newVersion} (Base: v{baseVersion})`.
  - In *Attributes & Lifecycle*, the Version field renders an editable draft version input defaulting to the calculated next version, alongside the base version reference.
- **Saved Entity Version**: When saved, the new version number is written to both the top-level entity (`item.version`) and `item.raw.version`.

---

## 4. Operation 1: Assign a New Product Offering Price (POP) / Add Custom Price Component
- **Searchable Keystroke Dropdown for Adding Price Components (`SearchableOfferingPriceSelect`)**:
  - The "Add Custom Price Component" feature provides a live, keystroke-searchable combobox.
  - In the pulldown list, users see:
    - **Offering Name** (in bold)
    - **Offering Version** (in a distinct `v{version}` badge)
    - **Offering ID** (in a mono badge)
    - Preview of any attached price values / components (e.g. `€29.99 EUR · monthly`)
  - Keystroke search dynamically filters by Offering Name, Offering ID, or Version string (e.g. `v1`, `v2`).
  - Selecting an offering from the pulldown assigns its price component(s) to the option in `formData.pops`.
- **Blank Custom POP Creation**:
  - Direct `[+ New Blank POP]` action allowing creation of a new unlinked price component from scratch.
- **Configurable Price Fields (In-Place Editing)**:
  - **Amount (€)**: Numeric input (e.g. `19.99`).
  - **Price Type**: Dropdown selecting `Recurring charge`, `One time charge`, or `Usage charge`.
  - **Billing Cycle**: Dropdown selecting `monthly`, `yearly`, or `weekly`.
- **Delete / Remove POP**:
  - Each attached price component includes a trash icon button `[🗑]` to instantly unassign it from the option.

---

## 5. Operation 2: Assign a New Product Specification with Version
- **Display with Version**:
  - The specification must always be shown with its version number: e.g. `ps_name (v1)`.
- **Searchable Keystroke Dropdown (`SearchableSpecSelect`)**:
  - The specification dropdown is formatted according to `agent.md` and catalog data definitions.
  - Users can type keystrokes to filter specifications in real time by:
    - Specification Name
    - Specification ID
    - Specification Version (e.g. typing `v1` or `v2`)
- **Read-Only Navigation Link**:
  - In read-only mode, the specification provides a direct navigation button/link (`View →`) to inspect the target Product Specification in the specification detail view.

---

## 6. Operation 3: Update Characteristic Values
- **Inline Value Editing**:
  - Every characteristic (`prodSpecCharValueUse` / `productSpecCharacteristic`) renders an editable input field in edit mode.
  - Typing in the input field updates `productSpecCharacteristicValue[0].value` in real time.
- **Add / Override Characteristic**:
  - Users can define a new characteristic or override a parameter by typing `Name` and `Value` and clicking `[+ Add Characteristic]`.
- **Remove Characteristic**:
  - Each characteristic row contains a delete button `[🗑]` to remove it from `prodSpecCharValueUse`.

---

## 7. Operation 4: Add & Remove Category Assignments
- **Searchable Keystroke Dropdown (`SearchableCategorySelect`)**:
  - The category pulldown allows typing keystrokes to filter all catalog categories in real time.
- **Strictly Categories Only**:
  - The dropdown filters out all non-category entities (`ProductOffering`, `ProductSpecification`, `ProductOfferingPrice`, `Rule`).
  - Only genuine `Category` entities and standard catalog categories (FN codes) are displayed.
- **Rich Catalog Hierarchy Formatting**:
  - Shows Category Name, Category ID badge (`FNxxx`), and Parent Category lineage (e.g. `Parent: FN01 (Broadband)`).
  - Displays match count indicator (e.g. `Matching "ftth" · 3 of 42 categories`).
- **Add Category Assignment**:
  - Clicking any category result or the `[+ Add]` button instantly assigns it to the option's `category` array.
- **Remove Category Assignment**:
  - **From Assignment Chips**: Each assigned category tag has an instant `✕` remove button.
  - **From Category Tree Groups**: Each category card in the hierarchical tree displays `[✕ Remove]` if assigned, or `[+ Assign]` if not assigned.
- **Real-Time Tree Hierarchy Reactivity**:
  - Adding or removing categories immediately updates the active category count and the Category Tree Groups list in the view.

---

## 8. In-Memory Save Behavior (Persistence Boundary)
- **Document JSON Update**:
  - Clicking `[Save New Version (JSON)]` updates the in-memory document JSON (`raw` representation) of the item.
  - The updated JSON includes the new version, updated specification, modified characteristics, assigned POPs, and category assignments.
  - The updated document is immediately viewable when toggling to the drawer's **JSON** tab (`activeTab === 'rawJson'`).
- **No Backend / External Persistence**:
  - The save operation updates the local/in-memory React state only (`onUpdateItem`).
  - It does **not** perform any external network POST/PUT/PATCH or file write (persistence is deferred to Release Management).

---

---

## 10. Rules Detail View: Rule Characteristics Tab (View, Edit & New Modes)
- **Dedicated Tab in Rule Detail Drawer**:
  - A third top-level tab labeled **Characteristics** with an active parameter count badge (`12 + N custom`) sits alongside "Visual Authoring" and "Raw TMF JSON".
- **Three Core Operational Scopes**:
  - Available across **View Mode**, **Edit Mode**, and **New Rule Creation Mode** (`view`, `edit`, `new`).
- **Comprehensive TMForum `ruleCharacteristic` Support**:
  - **Commercial Scope**:
    - `package_type`: Offering package classification (e.g. `primary_offering`, `add_on`).
    - `description`: Formal business rationale / compliance description.
    - `business_intent`: Targeted business intent (e.g. `commercial_eligibility`, `technical_dependency`).
    - `source_type`: Originating system (e.g. `CPQ_CATALOG_ADMIN`, `SYSTEM`).
  - **Execution Guardrails**:
    - `priority`: Numeric execution order with live increment/decrement steppers.
    - `operation_type`: Compatibility operation (e.g. `COMPATIBILITY_RESTRICTION`).
    - `effective_date`: Date picker controlling lifecycle activation.
    - `channels`: Multi-tag selector (`web`, `call_center`, `retail_store`, `b2b_portal`).
    - `process_contexts`: Multi-tag selector (`new_acquisition`, `change_plan`, `retention`, `renewal`).
  - **Action & Behavior**:
    - `operation.value`: Action enforcement (`INCOMPATIBLE`, `REQUIRES`, `RECOMMENDS`).
    - `operation.askconfirmationfirst`: Boolean toggle requiring customer consent.
    - `operation.overrideinitialselectable`: Boolean toggle for auto-selection override.
  - **Custom & Extended Characteristics**:
    - Ability to add arbitrary extended key-value parameters (`name`, `value`).
    - Inline editing and instant removal of custom attributes.
- **Search & Section Filtering**:
  - Live keystroke search filtering across characteristic names, descriptions, and current values.
  - Section pills: `All`, `Commercial Scope`, `Execution Guardrails`, `Action & Behavior`, and `Custom`.
- **Bidirectional Synchronization**:
  - State synchronizes bi-directionally between the Characteristics tab, Visual Authoring tab, and Raw TMF JSON tab.

---

## 11. Requirements Checklist Matrix

| # | Requirement | Scope | Status | Component |
|---|-------------|-------|--------|-----------|
| 1 | Immutable Name & ID fields | All entities (Option view) | ✅ Implemented | `StandardOfferingDetailTemplate.jsx` |
| 2 | Start updating a new version on edit | Option view | ✅ Implemented | `calculateNextVersion`, `formData.version` |
| 3 | Add Custom Price Component with searchable pulldown (Offering Name & Version) | Option view (Pricing tab) | ✅ Implemented | `SearchableOfferingPriceSelect.jsx`, `StandardOfferingDetailTemplate.jsx` |
| 4 | Assign a new Spec with version & keystroke search | Option view | ✅ Implemented | `SearchableSpecSelect.jsx` |
| 5 | Specification navigation link in read-only | Option view | ✅ Implemented | `onNavigateToEntity` |
| 6 | Update Characteristic values in-place | Option view (Characteristics tab) | ✅ Implemented | `handleCharValChange`, `formData.chars` |
| 7 | Add new / override characteristics | Option view (Characteristics tab) | ✅ Implemented | `handleAddChar`, `handleRemoveChar` |
| 8 | Searchable category pulldown by keystrokes | Option view (Categories tab) | ✅ Implemented | `SearchableCategorySelect.jsx` |
| 9 | Show strictly categories in pulldown (no other entities) | Option view (Categories tab) | ✅ Implemented | `availableCategoriesList` filter, `sanitizedCategories` |
| 10 | Remove category assignments (tags & tree cards) | Option view (Categories tab) | ✅ Implemented | `handleRemoveCategory` |
| 11 | In-memory JSON document update on Save | Option view | ✅ Implemented | `handleSave` -> `onUpdateItem` -> `raw` |
| 12 | Rule Characteristics Tab (Commercial Scope, Guardrails, Action/Behavior, Custom) | Rule Detail Drawer (View / Edit / New) | ✅ Implemented | `RuleDetailDrawer.jsx` |
