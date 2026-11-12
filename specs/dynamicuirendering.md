# Dynamic & Configurable UI Rendering Specification

This document details the architecture, design patterns, and extension points for the **Dynamic & Configurable UI Behavior** across **Detail Views** and **List Views** within the Vodafone DNEXT Deployment Studio.

---

## 1. Architectural Philosophy

In enterprise catalog management (TMF620), entities have varied structural models, commercial contexts, and lifecycle complexities:
- A broadband offering (Sales Package) requires download/upload speeds, technology badges (FTTH vs. DSL), and contractual commitments.
- A bundle offering requires tree cardinality, parent-child hierarchies, and composite pricing rollups.
- A technical specification requires characteristic definitions, types, and permissible values.
- A pricing entity (POP) requires charge period types (recurring, one-time) and currency values.

Rather than cluttering generic tables and detail modals with brittle ternary conditionals (`isBundle ? ... : isPop ? ... : ...`), the studio adopts a **Registry-Driven Configurable View Architecture**:

```
                              Catalog Entity / Query Context
                                            │
                                            ▼
                    ┌───────────────────────────────────────────────┐
                    │       Resolution Engine (Auto-Detect)         │
                    │  1. Check Entity Type                         │
                    │  2. Inspect Object Field Values (Spec, etc.)  │
                    │  3. Respect User Manual Override (if set)     │
                    └───────────────────────┬───────────────────────┘
                                            │
                    ┌───────────────────────┴───────────────────────┐
                    ▼                                               ▼
     ┌─────────────────────────────┐                 ┌─────────────────────────────┐
     │     List View Registry      │                 │    Detail View Registry     │
     │     (listViewRegistry)      │                 │    (viewTemplateRegistry)   │
     └──────────────┬──────────────┘                 └──────────────┬──────────────┘
                    ▼                                               ▼
       Render Dedicated List View                      Render Dedicated Detail View
   - AllObjectsListView                            - SalesPackageDetailTemplate
   - ProductOfferingsListView                      - BundleCompositionDetailTemplate
   - SalesPackagesListView                         - StandardOfferingDetailTemplate
   - ProductOfferingPricesListView                 - ProductOfferingPriceDetailTemplate
                                                   - ProductSpecificationDetailTemplate
                                                   - CategoryDetailTemplate
```

---

## 2. Configurable Detail Views

The configurable detail view system is anchored in two core files:
1. **Registry & Matchers**: [`frontend/src/components/detail-templates/viewTemplateRegistry.js`](file:///Users/serdarsuleyman/Downloads/dnext/dnext-deployment-studio/frontend/src/components/detail-templates/viewTemplateRegistry.js)
2. **Container & Shell**: [`frontend/src/components/DnextEntityDrawer.jsx`](file:///Users/serdarsuleyman/Downloads/dnext/dnext-deployment-studio/frontend/src/components/DnextEntityDrawer.jsx)

### 2.1 Available Detail Templates

| Template ID | Name & Icon | Criteria & Target Entities | Component |
| :--- | :--- | :--- | :--- |
| `sales_package` | 🛍️ Sales Package View | `ProductOffering` where `productSpecification` matches a Sales Package specification. | [`SalesPackageDetailTemplate.jsx`](file:///Users/serdarsuleyman/Downloads/dnext/dnext-deployment-studio/frontend/src/components/detail-templates/SalesPackageDetailTemplate.jsx) |
| `bundle_composition` | 🎁 Bundle Composition View | `ProductOffering` where `isBundle === true` or has `bundledProductOffering` children. | [`BundleCompositionDetailTemplate.jsx`](file:///Users/serdarsuleyman/Downloads/dnext/dnext-deployment-studio/frontend/src/components/detail-templates/BundleCompositionDetailTemplate.jsx) |
| `standard_offering` | 📦 Standard Offering View | Any `ProductOffering` (fallback baseline). | [`StandardOfferingDetailTemplate.jsx`](file:///Users/serdarsuleyman/Downloads/dnext/dnext-deployment-studio/frontend/src/components/detail-templates/StandardOfferingDetailTemplate.jsx) |
| `price_model` | 🏷️ Pricing Model View | `ProductOfferingPrice` entities. | [`ProductOfferingPriceDetailTemplate.jsx`](file:///Users/serdarsuleyman/Downloads/dnext/dnext-deployment-studio/frontend/src/components/detail-templates/ProductOfferingPriceDetailTemplate.jsx) |
| `specification` | 📋 Technical Spec View | `ProductSpecification` entities. | [`ProductSpecificationDetailTemplate.jsx`](file:///Users/serdarsuleyman/Downloads/dnext/dnext-deployment-studio/frontend/src/components/detail-templates/ProductSpecificationDetailTemplate.jsx) |
| `category` | 📂 Category Hierarchy View | `Category` entities. | [`CategoryDetailTemplate.jsx`](file:///Users/serdarsuleyman/Downloads/dnext/dnext-deployment-studio/frontend/src/components/detail-templates/CategoryDetailTemplate.jsx) |

### 2.2 Resolution Logic

When an item is opened in the drawer:
```javascript
export function resolveTemplateId(item) {
  if (!item) return 'standard_offering';

  // 1. Sales Package specific criteria (Strictly based on Product Specification)
  if (TEMPLATES.SALES_PACKAGE.matches(item)) {
    return 'sales_package';
  }

  // 2. Bundle composition criteria (isBundle / bundledProductOffering)
  if (TEMPLATES.BUNDLE_COMPOSITION.matches(item)) {
    return 'bundle_composition';
  }

  // 3. Entity type based matchers
  if (TEMPLATES.PRICE_MODEL.matches(item)) return 'price_model';
  if (TEMPLATES.SPECIFICATION.matches(item)) return 'specification';
  if (TEMPLATES.CATEGORY.matches(item)) return 'category';

  // 4. Default fallback
  return 'standard_offering';
}
```

> [!IMPORTANT]
> **Specification Identification Rule**: Sales packages are identified strictly based on the entity's `productSpecification` (`id`, `name`, `@id`, `href`), **never on characteristics** (`prodSpecCharValueUse`).

### 2.3 User Manual Override

[`DnextEntityDrawer.jsx`](file:///Users/serdarsuleyman/Downloads/dnext/dnext-deployment-studio/frontend/src/components/DnextEntityDrawer.jsx) features a Template Selector in the tab bar. Users can override the automatic resolution at any time:
- The dropdown indicates which template was auto-resolved: `🛍️ Sales Package View (Auto)`.
- If overridden, selecting a template updates the view immediately.
- Re-opening or changing entities automatically resets the override back to Auto.

---

## 3. Configurable List Views

List views follow the same design pattern as detail views, centralized in [`frontend/src/components/list-views/`](file:///Users/serdarsuleyman/Downloads/dnext/dnext-deployment-studio/frontend/src/components/list-views/):

1. **Registry & Matchers**: [`frontend/src/components/list-views/listViewRegistry.js`](file:///Users/serdarsuleyman/Downloads/dnext/dnext-deployment-studio/frontend/src/components/list-views/listViewRegistry.js)
2. **Dispatcher Component**: [`frontend/src/components/list-views/ConfigurableListView.jsx`](file:///Users/serdarsuleyman/Downloads/dnext/dnext-deployment-studio/frontend/src/components/list-views/ConfigurableListView.jsx)
3. **Consumer**: [`frontend/src/components/DnextRemoteCatalogView.jsx`](file:///Users/serdarsuleyman/Downloads/dnext/dnext-deployment-studio/frontend/src/components/DnextRemoteCatalogView.jsx)

### 3.1 Available List View Components

| List Template ID | Name & Icon | Columns & Features | Component |
| :--- | :--- | :--- | :--- |
| `all_objects` | 🌐 All Objects Overview | 6 columns: `[Select, Type, ID, Name, Version, Status]`. Does **not** include the Product Specification column. | [`AllObjectsListView.jsx`](file:///Users/serdarsuleyman/Downloads/dnext/dnext-deployment-studio/frontend/src/components/list-views/AllObjectsListView.jsx) |
| `product_offerings` | 📦 Product Offerings View | 7 columns: includes dedicated **Product Specification** column with clickable chips and spec filtering. | [`ProductOfferingsListView.jsx`](file:///Users/serdarsuleyman/Downloads/dnext/dnext-deployment-studio/frontend/src/components/list-views/ProductOfferingsListView.jsx) |
| `sales_packages` | 🛍️ Sales Packages View | Configurable columns: ID, Name, Spec, Speed, Tariff Codes, PSM Code, MAF(Base), Version, Lifecycle. Interactive version tree expansion on version click. | [`SalesPackagesListView.jsx`](file:///Users/serdarsuleyman/Downloads/dnext/dnext-deployment-studio/frontend/src/components/list-views/SalesPackagesListView.jsx) |
| `options` | 🧩 Options View | Configurable columns: ID, Option Name, SKU, Product Family, Option Spec, MAF(Base), Tariff Code, PSM Code, Version, Lifecycle. Interactive version tree expansion on version click. | [`OptionsListView.jsx`](file:///Users/serdarsuleyman/Downloads/dnext/dnext-deployment-studio/frontend/src/components/list-views/OptionsListView.jsx) |
| `price_models` | 🏷️ Offering Prices View | 7 columns: Charge Type (Recurring / One-Time / Bundle POP), Amount & Currency, Version, Status. | [`ProductOfferingPricesListView.jsx`](file:///Users/serdarsuleyman/Downloads/dnext/dnext-deployment-studio/frontend/src/components/list-views/ProductOfferingPricesListView.jsx) |

### 3.2 List View Resolution Context

The list template resolution is evaluated using a context object:
```javascript
const listContext = {
  typeFilter: 'ProductOffering', // 'all', 'ProductOffering', 'ProductOfferingPrice', etc.
  subFilter: 'options',          // 'sales_packages', 'options', 'bundle', 'simple', 'recurring', etc.
  specFilter: 'all'              // Specific specification name or 'all'
};
```

Resolution logic in `resolveListViewTemplateId(context, sampleItem)`:
1. If `context.subFilter === 'sales_packages'` or `sampleItem` matches a sales package specification -> resolves `'sales_packages'`.
2. If `context.subFilter === 'options'` or `sampleItem` matches an option specification (`*option*` in spec name) -> resolves `'options'`.
3. If `context.typeFilter === 'ProductOfferingPrice'` -> resolves `'price_models'`.
4. If `context.typeFilter === 'ProductOffering'` -> resolves `'product_offerings'`.
5. Otherwise -> resolves `'all_objects'`.

### 3.3 Configurable Column Mappings (SalesPackagesListView)

Specialized list views like [`SalesPackagesListView.jsx`](file:///Users/serdarsuleyman/Downloads/dnext/dnext-deployment-studio/frontend/src/components/list-views/SalesPackagesListView.jsx) support **configurable, sortable, and filterable column mappings**:

* **Declarative JSONPath Extraction**: Columns can define a `jsonPath` to extract nested attributes from TMF entities without writing JSX.
  * E.g., `tariff_code_internet`: `$.prodSpecCharValueUse[?(@.name=="InternetTariffCode")].productSpecCharacteristicValue[0].value`
  * E.g., `tariff_code_voice`: `$.prodSpecCharValueUse[?(@.name=="VoiceTariffCode")].productSpecCharacteristicValue[0].value`
* **Column Sorting (`sortable: true`)**:
  * Users can click any sortable column header to cycle between Ascending (`▲`), Descending (`▼`), and Default unsorted.
  * Supports alphabetical strings, numeric values (e.g. speeds, versions), and JSONPath-evaluated properties.
* **Column Filtering (`filterable: true`)**:
  * Inline filter row ("🔍 Filter Columns") allows typing search terms or selecting distinct options per column.
  * Active filter chips bar above the table displays applied filters with instant dismiss (`✕`) and "Clear all".
* **Schema-Driven Definitions**: Configured in [`salesPackageColumnConfig.js`](file:///Users/serdarsuleyman/Downloads/dnext/dnext-deployment-studio/frontend/src/components/list-views/salesPackageColumnConfig.js) with 12 customizable attributes across Core, Commercial, Technical, and Fulfillment domains.
* **Presets Engine**: One-click quick selection between business presets:
  * **Default**: `[Technology, ID, Name, Specification, Version, Lifecycle]`
  * **Commercial**: `[Name, Technology, Monthly Fee, Contract Term, Speed, Lifecycle]`
  * **Fulfillment & Tariff Codes**: `[ID, Name, Technology, Internet Tariff Code, Voice Tariff Code, Specification, Version]`
  * **Technical**: `[ID, Name, Technology, Speed, Internet Tariff Code, Specification, Version, Lifecycle]`
  * **Full Details**: All 12 attributes visible.
* **Customizer Popover ("⚙️ Columns")**: Categorized checkboxes allowing users to toggle individual columns on and off.
* **Persistent Preferences**: Saves the active column list in `localStorage` (`dnext_sp_visible_columns`).
* **Tree Alignment**: Version tree sub-rows (`prevItem`) dynamically mirror parent visible columns, preserving perfect table alignment.

---

## 4. How to Add a New Detail View (Step-by-Step)

Follow this 4-step guide whenever you need to add a specialized detail view for an entity type, specification, or business domain (e.g., SIM Cards, Add-on Options, Hardware Routers).

### Step 1: Create the Detail Template Component
Create a new file in `frontend/src/components/detail-templates/MyCustomDetailTemplate.jsx`:

```jsx
import React, { useState } from 'react';

export default function MyCustomDetailTemplate({ item, onNavigateToPrice, copyToClipboard, copiedKey }) {
  const raw = item?.raw || {};

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Banner / Header Card */}
      <div style={{
        background: 'rgba(99, 102, 241, 0.1)',
        border: '1px solid rgba(99, 102, 241, 0.3)',
        borderRadius: '10px',
        padding: '16px 20px'
      }}>
        <h3 style={{ margin: 0, color: '#fff', fontSize: '16px' }}>
          🚀 Custom Domain View: {item.name || item.id}
        </h3>
        <p style={{ margin: '6px 0 0 0', color: '#9ca3af', fontSize: '13px' }}>
          {item.description || 'Specialized entity view'}
        </p>
      </div>

      {/* Your Custom Domain Sections, Cards, Visualizers */}
      <div style={{ background: '#151722', borderRadius: '8px', padding: '16px' }}>
        {/* Render relevant attributes */}
      </div>
    </div>
  );
}
```

### Step 2: Register in `viewTemplateRegistry.js`
Open [`frontend/src/components/detail-templates/viewTemplateRegistry.js`](file:///Users/serdarsuleyman/Downloads/dnext/dnext-deployment-studio/frontend/src/components/detail-templates/viewTemplateRegistry.js) and register your template:

```javascript
export const TEMPLATES = {
  // Existing templates...
  
  MY_CUSTOM_VIEW: {
    id: 'my_custom_view',
    name: 'Custom Domain View',
    icon: '⚡',
    badge: 'Custom View',
    description: 'Specialized view based on specification or field criteria',
    applicableTypes: ['ProductOffering'], // or any applicable entity type
    matches: (item) => {
      // Define your matcher criteria (based on entityType, field values, specification)
      if (item?.entityType !== 'ProductOffering') return false;
      const spec = item.productSpecification || item.raw?.productSpecification;
      const specName = (spec?.name || spec?.id || '').toLowerCase();
      return specName.includes('my_custom_spec');
    }
  }
};
```

### Step 3: Update `resolveTemplateId`
In the same file, add your matcher check with appropriate priority:

```javascript
export function resolveTemplateId(item) {
  if (!item) return 'standard_offering';

  // Check your custom view matching condition
  if (TEMPLATES.MY_CUSTOM_VIEW.matches(item)) {
    return 'my_custom_view';
  }

  // Continue with other checks...
}
```

### Step 4: Render in `DnextEntityDrawer.jsx`
Open [`frontend/src/components/DnextEntityDrawer.jsx`](file:///Users/serdarsuleyman/Downloads/dnext/dnext-deployment-studio/frontend/src/components/DnextEntityDrawer.jsx):
1. Import your component:
   ```javascript
   import MyCustomDetailTemplate from './detail-templates/MyCustomDetailTemplate';
   ```
2. Add a rendering branch in the template switcher block:
   ```jsx
   {selectedTemplateId === 'my_custom_view' ? (
     <MyCustomDetailTemplate
       item={currentItem}
       onNavigateToPrice={handleNavigateToPrice}
       copyToClipboard={copyToClipboard}
       copiedKey={copiedKey}
     />
   ) : selectedTemplateId === 'sales_package' ? (
     // ...
   ```

---

## 5. How to Add a New List View (Step-by-Step)

Adding a new list view template follows the same pattern in `frontend/src/components/list-views/`.

### Step 1: Create the List View Component
Create `frontend/src/components/list-views/MyCustomListView.jsx`:

```jsx
import React from 'react';
import { C, ENTITY_CONFIG } from './constants';

export default function MyCustomListView({
  groups = [],
  selectedIds = new Set(),
  expandedGroups = new Set(),
  onToggleSelectAll,
  onToggleSelectItem,
  onToggleExpand,
  onOpenDetail
}) {
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
      <thead>
        <tr>
          {/* Define your columns */}
        </tr>
      </thead>
      <tbody>
        {groups.map(group => {
          const item = group.latestItem;
          return (
            <tr key={group.groupKey} onDoubleClick={() => onOpenDetail && onOpenDetail(item)}>
              {/* Render row cells */}
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
```

### Step 2: Register in `listViewRegistry.js`
Open [`frontend/src/components/list-views/listViewRegistry.js`](file:///Users/serdarsuleyman/Downloads/dnext/dnext-deployment-studio/frontend/src/components/list-views/listViewRegistry.js):
1. Import your component:
   ```javascript
   import MyCustomListView from './MyCustomListView';
   ```
2. Add the template definition in `LIST_VIEW_TEMPLATES`:
   ```javascript
   MY_CUSTOM_LIST: {
     id: 'my_custom_list',
     name: 'My Custom List',
     icon: '✨',
     badge: 'Custom',
     description: 'Custom list view layout for specific entities',
     applicableTypes: ['ProductOffering'],
     component: MyCustomListView,
     matches: (context, sampleItem) => {
       // match criteria based on context or sampleItem field values
       return context.typeFilter === 'ProductOffering' && context.subFilter === 'my_sub_filter';
     }
   }
   ```
3. Update `resolveListViewTemplateId(context, sampleItem)` to trigger your template when matched.

---

## 6. Configurable Columns & JSONPath Multi-Value Consolidation

In [`SalesPackagesListView.jsx`](file:///Users/serdarsuleyman/Downloads/dnext/dnext-deployment-studio/frontend/src/components/list-views/SalesPackagesListView.jsx), column definitions are fully configurable via [`salesPackageColumnConfig.js`](file:///Users/serdarsuleyman/Downloads/dnext/dnext-deployment-studio/frontend/src/components/list-views/salesPackageColumnConfig.js).

### 6.1 JSONPath Evaluator Capabilities
The zero-dependency `evaluateJsonPath(item, pathStr)` supports:
- Dot-traversal: `prop.subprop`
- Array indices & wildcards: `items[0].value`, `items[*].value`
- Array property mapping: `productSpecCharacteristicValue.value`
- Array predicate filtering: `[?(@.name == "tariff_code_voice")]`
- Multi-path fallbacks separated by `||`: `path1 || path2`
- **Multi-Value Consolidation**: If a characteristic has multiple values in `productSpecCharacteristicValue` (e.g. `[{"value":"IP528"},{"value":"IP531"}]`), the evaluator extracts all values, removes duplicates, and consolidates them into a clean string (`"IP528, IP531"`).
- In the table rendering, each consolidated code is displayed as its own styled pill badge (`🏷️ IP528` `🏷️ IP531`).

### 6.2 Declarative JSONPath Column Schema

All configurable columns in [`salesPackageColumnConfig.js`](file:///Users/serdarsuleyman/Downloads/dnext/dnext-deployment-studio/frontend/src/components/list-views/salesPackageColumnConfig.js) declare declarative `jsonPath` attributes, replacing ad-hoc extraction functions:

| Column Key | Column Name | Declarative `jsonPath` Expression |
| :--- | :--- | :--- |
| `id` | ID / Identifier | `$.id` |
| `name` | Sales Package Name | `$.name` |
| `spec` | Package Specification | `$.productSpecification.name \|\| $.productSpecification.id` |
| `speed` | Speed (Down/Up) | `$.prodSpecCharValueUse[?(@.name=="download_speed")].productSpecCharacteristicValue[*].value \|\| $.prodSpecCharValueUse[?(@.name=="downstream_bandwidth")].productSpecCharacteristicValue[*].value \|\| $.prodSpecCharValueUse[?(@.name=="speed_download")].productSpecCharacteristicValue[*].value \|\| $.prodSpecCharValueUse[?(@.name=="Bandwidth")].productSpecCharacteristicValue[*].value` |
| `tariff_code_internet` | Internet Tariff Code | `$.prodSpecCharValueUse[?(@.name=="tariff_code_internet")].productSpecCharacteristicValue[*].value \|\| $.prodSpecCharValueUse[?(@.name=="InternetTariffCode")].productSpecCharacteristicValue[*].value \|\| $.prodSpecCharValueUse[?(@.name=="tariff_code_voice")].productSpecCharacteristicValue[*].value` |
| `tariff_code_voice` | Voice Tariff Code | `$.prodSpecCharValueUse[?(@.name=="tariff_code_voice")].productSpecCharacteristicValue[*].value \|\| $.prodSpecCharValueUse[?(@.name=="VoiceTariffCode")].productSpecCharacteristicValue[*].value` |
| `psm_code` | PSM Code | `$.prodSpecCharValueUse[?(@.name=="psm_aaw_packet_id")].productSpecCharacteristicValue[*].value \|\| $.prodSpecCharValueUse[?(@.name=="psmAawPacketId")].productSpecCharacteristicValue[*].value \|\| $.prodSpecCharValueUse[?(@.name=="PSM_AAW_PACKET_ID")].productSpecCharacteristicValue[*].value \|\| $.prodSpecCharValueUse[?(@.name=="psm_packet_id")].productSpecCharacteristicValue[*].value \|\| $.prodSpecCharValueUse[?(@.name=="psm_code")].productSpecCharacteristicValue[*].value \|\| $.psm_aaw_packet_id` |
| `maf` | MAF(Base) | `$.prodSpecCharValueUse[?(@.name=="maf")].productSpecCharacteristicValue[*].value \|\| $.prodSpecCharValueUse[?(@.name=="MAF")].productSpecCharacteristicValue[*].value \|\| $.prodSpecCharValueUse[?(@.name=="maf_base")].productSpecCharacteristicValue[*].value \|\| $.prodSpecCharValueUse[?(@.name=="monthly_access_fee")].productSpecCharacteristicValue[*].value \|\| $.productOfferingPrice[?(@.priceType=="recurring")].price.value \|\| $.productOfferingPrice[*].price.value` |
| `version` | Version | `$.version` |
| `lifecycle` | Lifecycle Status | `$.lifecycleStatus` |

> [!NOTE]
> Ad-hoc extraction functions (`detectTechnology`, `extractMonthlyPrice`, `extractContractTerms`, `extractCategories`) were removed in favor of declarative `jsonPath` attributes, with `extractSpeedProfile` retained for dual bandwidth (down/up) profile formatting. Redundant columns (`Technology`, `Contract Term`, `Catalog Placement`) have been omitted from list views.

---

## 7. Configurable Left Navigation Menu

The catalog explorer's left navigation drawer is driven by a declarative JSON configuration: [`frontend/src/config/leftMenuConfig.json`](file:///Users/serdarsuleyman/Downloads/dnext/dnext-deployment-studio/frontend/src/config/leftMenuConfig.json).

### 7.1 Architecture & Components

- **Configuration File**: [`frontend/src/config/leftMenuConfig.json`](file:///Users/serdarsuleyman/Downloads/dnext/dnext-deployment-studio/frontend/src/config/leftMenuConfig.json) defines sections, menu items, icons, filter mappings, and target list view templates.
- **Service Layer**: [`frontend/src/components/navigation/leftMenuService.js`](file:///Users/serdarsuleyman/Downloads/dnext/dnext-deployment-studio/frontend/src/components/navigation/leftMenuService.js) handles:
  - `isMenuItemActive(item)`: Validates whether an item or section is active (`active: true | false`, `"true" | "false"`, or `status: "active" | "inactive"`).
  - `getActiveMenuSections(config)`: Filters out any inactive sections, items, or nested sub-items (omits sections that have no active items).
  - `isMenuItemSelected(item, currentContext)`: Computes active selection highlighting against the current explorer filter state.
- **Visual Component**: [`frontend/src/components/navigation/ConfigurableLeftMenu.jsx`](file:///Users/serdarsuleyman/Downloads/dnext/dnext-deployment-studio/frontend/src/components/navigation/ConfigurableLeftMenu.jsx) renders the active sections and handles accordion collapsible states.
- **Host View Integration**: [`frontend/src/components/DnextRemoteCatalogView.jsx`](file:///Users/serdarsuleyman/Downloads/dnext/dnext-deployment-studio/frontend/src/components/DnextRemoteCatalogView.jsx) receives `onSelectMenuItem(item)`:
  ```javascript
  const handleSelectMenuItem = (menuItem) => {
    if (!menuItem) return;
    if (menuItem.filterContext) {
      if (menuItem.filterContext.typeFilter !== undefined) setTypeFilter(menuItem.filterContext.typeFilter);
      if (menuItem.filterContext.subFilter !== undefined) setSubFilter(menuItem.filterContext.subFilter);
      if (menuItem.filterContext.specFilter !== undefined) setSpecFilter(menuItem.filterContext.specFilter);
      if (menuItem.filterContext.statusFilter !== undefined) setStatusFilter(menuItem.filterContext.statusFilter);
    }
    if (menuItem.targetListViewTemplateId) {
      setUserListTemplateId(menuItem.targetListViewTemplateId);
    }
  };
  ```

### 7.2 Visibility Rule (`active: true | false` / `status: "active" | "inactive"`)

Any menu section, item, or child item can be hidden from the left pane by editing its configuration in `leftMenuConfig.json`:

```json
{
  "id": "bundles",
  "label": "Bundles",
  "icon": "🎁",
  "active": false,
  "filterContext": {
    "typeFilter": "ProductOffering",
    "subFilter": "bundle"
  },
  "targetListViewTemplateId": "product_offerings"
}
```

- When `active: false` or `status: "inactive"` is set, the item is completely excluded from the navigation bar on initial load and runtime.
- If all items in a section are inactive, the entire section title is automatically hidden.

---

## 8. Summary Checklist

When developing or extending dynamic views in the studio:

- [ ] **Decoupled Components**: Keep list and detail views in their respective directories (`list-views/` and `detail-templates/`).
- [ ] **No Monolithic Tables**: Do not inject conditional columns via inline ternaries into `AllObjectsListView`. Create a dedicated list component if columns differ.
- [ ] **Strict Specification Matching**: Match business package types (e.g. Sales Packages) using the entity's `productSpecification` (`id`, `name`), **never** by parsing characteristics (`prodSpecCharValueUse`).
- [ ] **Configurable Left Menu**: Adjust visibility and list view mappings via [`leftMenuConfig.json`](file:///Users/serdarsuleyman/Downloads/dnext/dnext-deployment-studio/frontend/src/config/leftMenuConfig.json) using `active: true | false`.
- [ ] **Preserve Auto & Manual Selection**: Always register templates in the registry so both auto-resolution and user manual switching remain functional.
- [ ] **Verify Builds**: Run `npm --prefix frontend run build` to confirm zero lint/syntax errors after adding new view templates.
