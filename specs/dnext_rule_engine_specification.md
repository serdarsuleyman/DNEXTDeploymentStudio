# DNEXT Rule Engine — Compatibility Rules Specification

**Source System:** DNEXT Rule Engine UI (`v1.4.2`) — `https://drule-ui.test-gcu.com/ui/ruleEngine/rule`  
**Scope:** Strictly read-only analysis of existing rule authoring structure (`382` total rules, `300` `implicitCompatibility` rules) to serve as a functional specification for building a more user-friendly Rule Engine UI.

---

## 1. High-Level Architecture & Navigation

The current Rule Engine UI is organized into three top-level modules in the left sidebar:

| Module | Route | Observed Records | Purpose |
| :--- | :--- | :--- | :--- |
| **Basic Rules** | `/ui/ruleEngine/rule` | 382 (300 `implicitCompatibility`) | Individual rule definitions |
| **Rule Sets** | `/ui/ruleEngine/rule-set` | 1 (QA draft) | Grouping of rules |
| **Decision Trees** | `/ui/ruleEngine/decision-tree` | 1 (QA draft) | Decision tree rule definitions |

### Key Architectural Observations
- **No dynamic dictionary/admin screens:** There are no separate UI screens for managing Categories, Parameters, Functions, Dictionaries, or Rule Testing/Dry-run. Facts and result structures are statically configured in the frontend.
- **No auxiliary rule tabs:** Opening a rule shows only a **4-step wizard**. There is no JSON/Raw view, Version History, Audit Log, or Dry-Run/Simulation tab.

---

## 2. Rules List & Filtering View

The Basic Rules list view supports the following capabilities:
- **Table Columns:** `ID`, `Name`, `Category`, `Type`, and row action (`delete` icon).
- **Pagination:** Page sizes `10`, `25`, `50`, `100`.
- **Search & Filters:**
  - `Search by Name` (free-text)
  - `-- Select Service --` (`DPCMS`, `Customer Management`)
  - `-- Select Resource Type --` (disabled until a Service is selected)
  - `Select categories` (multi-select): `implicitCompatibility`, `implicitEligibility`, `pricingLogicAlgorithm`, `salesRules`
  - `Select statuses` (multi-select): `draft`, `active`, `inactive`
  - `Select state categories` (multi-select): `initial`, `in progress`, `terminal success`
- **Actions:** `Refresh`, `Create Basic Rule`

---

## 3. Rule Authoring Data Model (4-Step Wizard)

Every Basic Rule is authored across 4 sequential steps:
1. **Rule Info** (Metadata & Compatibility Characteristics)
2. **Resource Selection** (Service / Entity / Asset Group Filter)
3. **Rule Configuration** (Quantifier, Condition Logic / LHS)
4. **Result Configuration** (Target Scope / RHS)

---

### Step 1: Rule Info (Metadata & Characteristics)

#### Core Fields
| Field | Control Type | Required | Values / Notes |
| :--- | :--- | :--- | :--- |
| **Rule Name** | Textbox | Yes | Human-readable rule description |
| **Rule ID** | Textbox | Auto/Read-only | Disabled in edit mode (e.g., `CR006472`) |
| **Rule Category** | Combobox | Yes | `implicitCompatibility`, `implicitEligibility`, `pricingLogicAlgorithm`, `salesRules` |
| **Status&State Group** | Combobox | Yes | `draft (initial)`, `active (in progress)`, `inactive (terminal success)` |

#### Characteristics (Key-Value List)
Each rule has an expandable list of key-value pairs (`Name*`, `Value*`, optional `Value Type`, delete button, `+ Add Characteristic`).

For **`implicitCompatibility`** rules, the following **11 standard characteristics** are consistently used as untyped string key-value rows:

| Characteristic Name | Purpose | Observed Example Values |
| :--- | :--- | :--- |
| `package_type` | Product line / domain | `DSL` |
| `description` | Extended rule description | Free text |
| `source_type` | Origin entity type | `Service` |
| `priority` | Evaluation priority | Numeric string (`2`, `5`, `6`) |
| `operation_type` | Compatibility relationship type | `Service-Service`, `Service-Product` |
| `effective_date` | Rule start date | ISO date string (`2024-12-09`, `2026-04-09`) |
| `operation.value` | **Compatibility outcome (action)** | `Allowed`, `Defaulted`, `Defaulted-Obligated`, `Removal Not Allowed` |
| `operation.askconfirmationfirst` | Whether UI prompts user before applying | `false` (boolean string) |
| `operation.overrideinitialselectable` | Whether initial selectability is overridden | `false` (boolean string) |
| `channels` | Applicable sales channels | `*` |
| `process_contexts` | Applicable order/journey contexts | Comma-separated (`ILSBLU,MOVBLU`, `ACQ,ILSBLU,MIGCOC`, `ILSBLU,MOV121,MOVBLU`) |

> **Important Design Note:** In the current UI, the **compatibility outcome** (`operation.value`) and **applicability metadata** (`effective_date`, `channels`, `process_contexts`, `priority`) are buried in Step 1 as raw key-value strings rather than typed form controls or part of the `THEN` (Result) step.

---

### Step 2: Resource Selection

| Field | Control Type | Notes |
| :--- | :--- | :--- |
| **Select Service** | Combobox | `DPCMS`, `Customer Management` |
| **Select Entity** | Combobox | Disabled until Service is selected |
| **Select Filter Type** | Combobox | Disabled until Service/Entity selected: `SetAssetGroup`, `ListAssetGroup`, `FilterAssetGroup`, `JSONPathAssetGroup` |

> **Observed Usage:** Often left unselected (`-- Select Service --`) on `implicitCompatibility` rules.

---

### Step 3: Rule Configuration (Condition Builder / LHS)

#### Rule Type (Quantifier)
Radio/selector options:
- `IF` (typically used by `salesRules`)
- `FORALL` (heavily used by `implicitCompatibility`)
- `FORSOME` (heavily used by `implicitCompatibility`)
- `FORNONE`
- `FORONE`

#### Condition Editor Type
1. **`Expression (Condition Configuration)`** — Visual condition tree builder
2. **`Script (MVEL Scripting)`** — Raw MVEL script editor

#### Visual Expression Builder Capabilities
- **Logical Combinators:** `AND` / `OR` toggle buttons between individual conditions and between nested condition groups.
- **Negation:**
  - Condition-level `Not` toggle
  - Group-level `Not` toggle
- **Nesting & Grouping:** `Add Condition`, `Add Condition Group`, `Link Conditions`, `link_off` (unlink), `Clear`.
- **Condition Anatomy:** Each condition consists of:
  1. A **Fact** selected from a flat 40-item autocomplete dropdown (`Select fact`).
  2. One or more **typed parameter inputs** (`string`, `integer`, `boolean`) matching the fact's signature.

#### Complete Catalog of Supported Facts (40 Facts)

**Agent (3)**
- `agent.hasCombinationOfChannelAndSubchannel(string)`
- `agent.hasOseChannel(string)`
- `agent.hasPermission(string)`

**Availability (3)**
- `availability.HasAdditionalOption(string, string, integer, string, integer)`
- `availability.hasHighestPriority(integer, string, string, string[, string])`
- `availability.HasTechnology(integer, integer, string, string[, string])`

**Cart / Package (22)**
- `cart.containsNBAIndicator(string)`
- `cart.containsProduct(integer)`
- `cart.containsProduct(string)`
- `cart.containsProductInCategory(string)`
- `cart.containsProductInCategoryName(string)`
- `cart.package.containsProductInProductFamily(string)`
- `cart.package.hasProcessContext(string)`
- `cart.package.hasProductWithVersion(string, string)`
- `cart.package.hasTariffWithContractValue(string)`
- `cart.package.hasTariffWithVersion(string)`
- `cart.package.isTariffChanged().eq(boolean)`
- `cart.package.productInMinimumDuration(string)`
- `cart.package.tariffInMinimumDuration().eq(boolean)`
- `cart.packageContainedInstalledBaseCategory(string)`
- `cart.packageContainedInstalledBaseProduct(string)`
- `cart.packageContainsInstalledBaseCategory(string)`
- `cart.packageContainsInstalledBaseProduct(string)`
- `cart.packageContainsNewProduct(string)`
- `cart.packageContainsNewProductInCategoryId(string)`
- `cart.packageContainsProduct(string)`
- `cart.packageContainsProductInCategory(string)`
- `cart.packageCreationTypeId(string)`

**Customer (4)**
- `customer.hasPendingOrderOfType(string, string)`
- `customer.isSoho().eq(boolean)`
- `customer.tariffIsInDay().gt(integer)`
- `CustomerObjectRef`

**InstallBase (2)**
- `installBase.containsProduct(string)`
- `installBase.containsProductInCategory(string)`

**Product / Order / Other (6)**
- `Product.hasSKU(string)`
- `MatchOrderLineWithAttributes`
- `MustIncludeProductsWithNames`
- `catch_all`

---

### Step 4: Result Configuration (Target Selector / RHS)

#### Result Type
Combobox options: `Simple`, `Complex`, `Attribute Value List`.

#### How `implicitCompatibility` Uses `Attribute Value List`
- `Result Name*` and `Result` are left empty.
- **`Result Attributes (name-value pairs)`** defines a hierarchical target selector tree:
  - **Top-level Named Group** (e.g., `Category 12 month package downgrade guarantee DSL`, `Product GS_Glas_PWP_IP532_12x5E`, `Product Versandkosten`)
    - `TargetAggregator`: e.g., `having` or `""`
    - `ConditionValue`: string
    - **`TargetCondition`** (1 or more blocks), each containing:
      - `Type`: e.g., `catalog.getProductsInCategory`, `catalog.getTariffsWithContractValue`, `Product`
      - `Operator`: string
      - `ConditionValue`: string
      - `Params`: list of `name` / `value` pairs (e.g., `categoryID = FN0548`, `Operation = <=`, `SKU = GS_Glas_PWP_IP532_12x5E[br]`)

*(By contrast, `salesRules` such as `SR599011` use `Result Type = Complex`, `Result Name = salesRules.actionContext`, with parameters `action_scope_category`, `action_scope`, `action`.)*

---

## 4. Concrete Rule Examples (As-Built)

### Example 1: `CR006472` — `12 month Wechselgarantie Packages DSL allowed`
- **Category / Type / Status:** `implicitCompatibility` | `FORALL` | `draft (initial)`
- **Characteristics:** `package_type=DSL`, `source_type=Service`, `priority=5`, `operation_type=Service-Service`, `effective_date=2024-12-09`, `operation.value=Allowed`, `operation.askconfirmationfirst=false`, `operation.overrideinitialselectable=false`, `channels=*`, `process_contexts=ILSBLU,MOVBLU`
- **Conditions (Expression):**
  - `cart.package.tariffInMinimumDuration().eq(boolean)` (`p1 = true`)
  - `AND` `installBase.containsProductInCategory(string)` (`categoryID = FN218`)
  - `AND` `customer.tariffIsInDay().gt(integer)` (`p1 = 365`)
  - `AND` `NOT` `cart.packageContainsProductInCategory(string)` (`categoryID = FN74`)
  - `AND` `cart.packageContainsProductInCategory(string)` (`categoryID = FN0548`)
  - `AND` `cart.package.hasProductWithVersion(string, string)` (`SKU = R025.5000000073-24`, `Operation = <`)
- **Result (`Attribute Value List`):**
  - Group: `Category 12 month package downgrade guarantee DSL` (`TargetAggregator = having`)
  - `TargetCondition 1`: `Type = catalog.getProductsInCategory`, `Params: categoryID = FN0548`
  - `TargetCondition 2`: `Type = catalog.getTariffsWithContractValue`, `Params: Operation = <=`

### Example 2: `CR006848` — `12X5 Euro Glasfaser PWP Promo offered for GPON in case of backoffice booking - 2`
- **Category / Type / Status:** `implicitCompatibility` | `FORALL` | `draft (initial)`
- **Characteristics:** `package_type=DSL`, `source_type=Service`, `priority=2`, `operation_type=Service-Product`, `effective_date=2026-04-09`, `operation.value=Defaulted`, `channels=*`, `process_contexts=ACQ,ILSBLU,MIGCOC`
- **Result (`Attribute Value List`):**
  - Group: `Product GS_Glas_PWP_IP532_12x5E`
  - `TargetCondition`: `Type = Product`, `Params: SKU = GS_Glas_PWP_IP532_12x5E[br]`

### Example 3: `CR006048` — `ACQ: Add Versandkosten in case of new access-Hardware or accessory but not for Eigenhardware`
- **Category / Type / Status:** `implicitCompatibility` | `FORSOME` | `draft (initial)`
- **Characteristics:** `package_type=DSL`, `source_type=Service`, `priority=6`, `operation_type=Service-Product`, `effective_date=2023-10-08`, `operation.value=Defaulted-Obligated`, `channels=*`, `process_contexts=ACQ,MIGCOC`
- **Conditions (Expression):**
  - `cart.containsProductInCategory(string)` (`categoryID = FN169`) `OR` `FN178` `OR` `FN109`
- **Result (`Attribute Value List`):**
  - Targets shipping fee product (`Versandkosten`).

### Example 4: `CR006213` — `Access HW not removable if HW in installedbase compatible`
- **Category / Type / Status:** `implicitCompatibility` | `FORSOME` | `draft (initial)`
- **Characteristics:** `package_type=DSL`, `source_type=Service`, `priority=5`, `operation_type=Service-Service`, `effective_date=2023-12-10`, `operation.value=Removal Not Allowed`, `channels=*`, `process_contexts=ILSBLU,MOV121,MOVBLU`
- **Conditions (Expression):**
  - Uses nested condition groups combining `availability.HasAdditionalOption(...)`, `cart.package.isTariffChanged().eq(boolean)`, `cart.containsProduct(...)`, and `installBase.containsProductInCategory(string)`.

---

## 5. UX Pain Points & Recommendations for a New Framework UI

When rebuilding this experience in your framework while keeping compatibility with the underlying rule model:

1. **Replace Raw Key-Value Characteristics with Typed Fields:**
   - Promote the 11 standard `implicitCompatibility` characteristics into structured, validated inputs:
     - `effective_date` → Date picker
     - `priority` → Number stepper
     - `operation.value` → Dropdown/Segmented control (`Allowed`, `Defaulted`, `Defaulted-Obligated`, `Removal Not Allowed`)
     - `operation_type` → Dropdown (`Service-Service`, `Service-Product`)
     - `process_contexts` / `channels` → Multi-select tag/chip inputs
     - `operation.askconfirmationfirst` / `operation.overrideinitialselectable` → Toggle switches
   - Serialize them back to the `Characteristics` key-value array on save so the backend contract remains unchanged.

2. **Unify `WHEN` (Applicability) → `IF` (Conditions) → `THEN` (Outcome + Target):**
   - Move `operation.value` and `operation_type` out of "Step 1 Metadata" and display them alongside the **Result Target** (`Attribute Value List`) in a single `THEN` section so authors read the rule naturally as: *"When `[process_contexts]` and `[conditions]`, then mark `[target products/categories]` as `[Allowed / Defaulted / Removal Not Allowed]`."*

3. **Humanize the 40 Facts & Add Catalog Pickers:**
   - Group facts by domain (`Cart & Package`, `Installed Base`, `Customer`, `Availability`, `Agent`, `Product`) with plain-language labels (e.g., *"Cart contains product in category"* instead of `cart.containsProductInCategory(string)`).
   - Provide searchable dropdowns/pickers for `categoryID` (e.g., `FN0548`) and `SKU` (e.g., `GS_Glas_PWP_IP532_12x5E`) instead of error-prone manual text entry.
   - Replace generic `p1` parameter labels (seen on facts like `tariffInMinimumDuration().eq(boolean)` and `tariffIsInDay().gt(integer)`) with descriptive labels (e.g., *"Is in minimum duration?"*, *"Days since tariff start >"*).

4. **Read-Only Summary & Dry-Run / Validation:**
   - Add a live **Natural-Language Rule Summary** sidebar/header that renders the full rule in readable English as the user edits.
   - Add a **JSON/Payload Preview** and **Test/Simulate against Sample Cart** panel if supported by your backend APIs.

---

## 6. API Endpoints & Data Definitions

### 6.1 Base URLs & Authentication
- **Rule Engine API Base URL** (configured in `assets/js/rule-engine-config.js`):
  `https://drule-api.test-gcu.com/api/ruleEngine/v1`
- **External Service Base URLs** (used by Step 2 Resource Selection):
  - **DPCMS (`ProductCatalogManagement`)**: `https://dpc-api.test-gcu.com/api/productCatalogManagement/v4` (entity list: `/productOffering`)
  - **Customer Management (`CustomerManagement`)**: `https://drule-ui.test-gcu.com/ui/ruleEngine/proxy/dcm/api/customerManagement/v4` (proxy to `https://dcm-api.test-gcu.com/api/customerManagement/v4`, entity list: `/customer`)
- **Static Frontend Descriptors** (facts, results, and config are not fetched from a backend API):
  - `GET /ui/ruleEngine/assets/js/fact-descriptor.js` (`globalThis.__factDescriptor`)
  - `GET /ui/ruleEngine/assets/js/result-descriptor.js` (`globalThis.__resultDescriptor`)
  - `GET /ui/ruleEngine/assets/js/rule-engine-config.js` (`globalThis.__rule_engine_config`)
- **Authentication (OIDC / OAuth2 Authorization Code + PKCE via Keycloak):**
  - Issuer: `https://diam.test-gcu.com/realms/orbitant-realm`
  - Discovery: `GET https://diam.test-gcu.com/realms/orbitant-realm/.well-known/openid-configuration`
  - Certs: `GET https://diam.test-gcu.com/realms/orbitant-realm/protocol/openid-connect/certs`
  - Client ID: `orbitant-ui-client`, Scope: `openid`, `responseType: "code"`
- **Required Request Headers:**
  - `Authorization: Bearer <JWT>`
  - `Accept: application/json;charset=utf-8`
  - `Content-Type: application/json;charset=utf-8`

### 6.2 Pagination & TMF Response Headers
List endpoints return **`206 Partial Content`** (when returning a paginated slice) or **`200 OK`** (when all items fit), with TMForum pagination headers:
- `content-range: items 1-10 / 382`
- `x-result-count: 10`
- `x-total-count: 382`
- `link: <...>; rel="self", <...>; rel="next", <...>; rel="last"`

### 6.3 Observed Read Endpoints

| Resource | Method & Path | Query Parameters | Notes |
| :--- | :--- | :--- | :--- |
| **List / Search Rules** | `GET /api/ruleEngine/v1/rule` | `offset`, `limit`, `sort`, `name*=<substr>`, `category=<val>`, `status=<val>`, `stateCategory=<val>` | `name*=` performs live contains/wildcard search |
| **Get Rule by ID** | `GET /api/ruleEngine/v1/rule/{id}` | — | Returns full `BasicRule` JSON |
| **List Rule Sets** | `GET /api/ruleEngine/v1/ruleSet` | `offset`, `limit`, `sort` | Returns array of `RuleSet` objects |
| **List Decision Trees** | `GET /api/ruleEngine/v1/decisionTree` | `offset`, `limit`, `sort` | Returns array of `DecisionTree` objects |

### 6.4 Standard TMForum CRUD Endpoints (Inferred from `@schemaLocation` & TMF Pattern)
*(Not executed during read-only inspection; follows standard TMForum REST conventions for `/rule`, `/ruleSet`, and `/decisionTree`.)*
- **Rules:** `POST /api/ruleEngine/v1/rule`, `PATCH /api/ruleEngine/v1/rule/{id}`, `DELETE /api/ruleEngine/v1/rule/{id}`
- **Rule Sets:** `GET /api/ruleEngine/v1/ruleSet/{id}`, `POST /api/ruleEngine/v1/ruleSet`, `PATCH /api/ruleEngine/v1/ruleSet/{id}`, `DELETE /api/ruleEngine/v1/ruleSet/{id}`
- **Decision Trees:** `GET /api/ruleEngine/v1/decisionTree/{id}`, `POST /api/ruleEngine/v1/decisionTree`, `PATCH /api/ruleEngine/v1/decisionTree/{id}`, `DELETE /api/ruleEngine/v1/decisionTree/{id}`
- **JSON Schemas:**
  - `/api/ruleEngine/v1/schema/rule.json`
  - `/api/ruleEngine/v1/schema/ruleset.json`
  - `/api/ruleEngine/v1/schema/decisiontree.json`

*(On `POST` create, omit server-managed audit fields: `createdDate`, `updatedDate`, `createdBy`, `updatedBy`, `href`, `revision`.)*

### 6.5 JSON Data Definitions

#### `BasicRule` (`GET /api/ruleEngine/v1/rule/CR006472`)
```json
{
  "@baseType": "Rule",
  "@schemaLocation": "/api/ruleEngine/v1/schema/rule.json",
  "@type": "BasicRule",
  "id": "CR006472",
  "href": "/api/ruleEngine/v1/rule/CR006472",
  "name": "12 month Wechselgarantie Packages DSL allowed",
  "branchName": "MATCH",
  "ruleType": "FORALL",
  "conditionVariantType": "expression",
  "condition": [
    "cart.package.tariffInMinimumDuration() == true",
    "installBase.containsProductInCategory(\"FN218\")",
    "customer.tariffIsInDay() > 365",
    "installBase.containsProductInCategory(\"FN74\")",
    "cart.packageContainsProductInCategory(\"FN0548\") || cart.package.hasProductWithVersion(\"R025.5000000073-24\", \"<\")"
  ],
  "result": {
    "@type": "Result",
    "variantType": "attributeValueList",
    "attribute": {
      "name": "Category 12 month package downgrade guarantee DSL",
      "attribute": [
        { "name": "TargetAggregator", "value": "having" },
        { "name": "ConditionValue", "value": "" },
        {
          "name": "TargetCondition",
          "attribute": [
            { "name": "Type", "value": "catalog.getProductsInCategory" },
            { "name": "Operator", "value": "" },
            { "name": "ConditionValue", "value": "" },
            {
              "name": "Params",
              "attribute": [
                { "name": "name", "value": "categoryID" },
                { "name": "value", "value": "FN0548" }
              ]
            }
          ]
        },
        {
          "name": "TargetCondition",
          "attribute": [
            { "name": "Type", "value": "catalog.getTariffsWithContractValue" },
            { "name": "Operator", "value": "" },
            { "name": "ConditionValue", "value": "" },
            {
              "name": "Params",
              "attribute": [
                { "name": "name", "value": "Operation" },
                { "name": "value", "value": "<=" }
              ]
            }
          ]
        }
      ]
    }
  },
  "category": ["implicitCompatibility"],
  "status": "draft",
  "stateCategory": "Initial",
  "ruleCharacteristic": [
    { "name": "package_type", "value": "DSL" },
    { "name": "description", "value": "12 month Wechselgarantie packages DSL allowed" },
    { "name": "source_type", "value": "Service" },
    { "name": "priority", "value": "5" },
    { "name": "operation_type", "value": "Service-Service" },
    { "name": "effective_date", "value": "2024-12-09" },
    { "name": "operation.value", "value": "Allowed" },
    { "name": "operation.askconfirmationfirst", "value": "false" },
    { "name": "operation.overrideinitialselectable", "value": "false" },
    { "name": "channels", "value": "*" },
    { "name": "process_contexts", "value": "ILSBLU,MOVBLU" }
  ],
  "aclRelatedParty": [
    {
      "@type": "RelatedParty",
      "id": "service-account-orbitant-backend-client",
      "name": "service-account-orbitant-backend-client",
      "role": "owner",
      "@referredType": "IAMUser"
    }
  ],
  "revision": 0,
  "createdDate": "2026-11-02T11:12:48.712Z",
  "updatedDate": "2026-11-02T11:12:48.712Z",
  "createdBy": "service-account-orbitant-backend-client",
  "updatedBy": "service-account-orbitant-backend-client"
}
```

#### `RuleSet` (`GET /api/ruleEngine/v1/ruleSet`)
```json
{
  "@baseType": "RuleSet",
  "@schemaLocation": "/api/ruleEngine/v1/schema/ruleset.json",
  "@type": "RuleSet",
  "id": "f74d3535-bc26-44c3-a3de-c715ad0e6032",
  "href": "/api/ruleEngine/v1/ruleSet/f74d3535-bc26-44c3-a3de-c715ad0e6032",
  "name": "qa-ruleset-ui-202610200637",
  "rule": [
    {
      "name": "qa-rule-in-set-202610200637",
      "ruleType": "IF",
      "conditionVariantType": "expression",
      "condition": ["true"],
      "result": { "name": "qa-result", "variantType": "simple" }
    }
  ],
  "category": ["qa"],
  "status": "draft",
  "stateCategory": "Initial",
  "revision": 0
}
```

#### `DecisionTree` (`GET /api/ruleEngine/v1/decisionTree`)
```json
{
  "@baseType": "DecisionTree",
  "@schemaLocation": "/api/ruleEngine/v1/schema/decisiontree.json",
  "@type": "DecisionTree",
  "id": "4d93599d-090f-4bd7-99c1-af6ca8c7877f",
  "href": "/api/ruleEngine/v1/decisionTree/4d93599d-090f-4bd7-99c1-af6ca8c7877f",
  "name": "qa-decisiontree-ui-202610200640",
  "rule": [
    {
      "name": "qa-rule-in-tree-202610200640",
      "ruleType": "IF",
      "conditionVariantType": "expression",
      "condition": ["true"],
      "result": { "name": "qa-result", "variantType": "simple" }
    }
  ],
  "category": ["qa"],
  "status": "draft",
  "stateCategory": "Initial",
  "revision": 0
}
```


