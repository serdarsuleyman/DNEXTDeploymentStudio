# Portfolio & Commercial Lifecycle Management (LCM) — AI-Generated Requirements

> **Source Context**: Derived from [lifecyclePmanagement.md](./lifecyclePmanagement.md) and Enterprise Architecture alignment for Vodafone Germany Product Catalog / Portfolio Lifecycle Management.
> **Scope**: Commercial entities (e.g., Sales Packages) and Portfolio orchestration. Technical entities (Product Offerings, Specifications, etc.) are out of direct LCM scope, though commercial changes may trigger tracked dependencies on technical models.

---

## 1. Confirmed Architectural Decisions

| # | Decision Area | Confirmed Choice |
| :--- | :--- | :--- |
| **DEC-1** | **Portfolio ↔ Entity Cardinality** | **N:M with version-per-portfolio-timeframe**: A commercial entity can span multiple Portfolios, and each Portfolio links to a specific effective version/draft. |
| **DEC-2** | **Drafting & Concurrency** | **One active draft per `(Entity, Target Portfolio)`**: Cloned from the latest approved/active version, with conflict warnings if overlapping timeframes exist. |
| **DEC-3** | **Portfolio Launch Gate** | **Configurable gate with exception/deferral**: Block launch by default if any linked entity is not Ready, but allow the Portfolio Manager to defer/unlink incomplete entities to a later Portfolio. |
| **DEC-4** | **Technical Dependency Tracking** | **Hybrid**: Structured Technical Dependency record (model ID, target version, external ticket/CR) with automated status sync via webhook/API when available, plus manual Technical Architect sign-off. |
| **DEC-5** | **Workflow Topology** | **Configurable DAG**: Sequential + parallel steps (e.g., Pricing and Legal in parallel after Commercial Definition), with a lighter delta-aware Update flow that can skip unchanged impact steps. |
| **DEC-6** | **Sales Package LCM Distinction** | **Composite dependency & pricing/eligibility validation**: Sales Packages must validate child commercial entities, pricing rules, and channel/segment eligibility within the same Portfolio timeframe before approval. |

---

## 2. Scope & Domain Boundaries

### REQ-1.1 Commercial Entity Focus
- The LCM tool **shall** manage the lifecycle of **commercial entities** (e.g., Sales Packages, commercial offers, bundles, commercial pricing/promotions).
- Technical entities (e.g., Product Offerings, Product Specifications, Service/Resource Specifications) **shall not** be directly authored or lifecycle-managed within this tool.

### REQ-1.2 Commercial-to-Technical Dependency Bridge (Hybrid)
- The system **shall** support creating structured **Technical Dependency** records (target technical model ID, target version, external change-request/ticket ID) whenever a commercial entity draft requires changes in underlying technical models.
- The system **shall** support automated status updates via webhook/API from external technical/deployment tooling when available, **and** require a **Technical Architect sign-off** before the dependency is marked `Fulfilled`.
- A commercial entity **shall not** pass its launch readiness gate while any linked Technical Dependency remains unfulfilled.

### REQ-1.3 Entity-Type-Specific LCM with Shared Core
- The system **shall** provide a **shared LCM core** for common workflow capabilities (DAG state engine, draft versioning, step assignment, approvals, audit trail).
- The system **shall** allow **entity-type-specific LCM configurations** (custom step DAGs, validation rules, required metadata per commercial entity type).

### REQ-1.4 Sales Package LCM (Independent Specification)
- **Sales Package LCM** **shall** be analyzed and specified independently due to its composite nature.
- Before final approval, a Sales Package draft **shall** pass composite validation checks confirming that:
  - All referenced child commercial entities are compatible and `Ready`/`Active` within the same Portfolio timeframe.
  - Pricing rules and discounts do not conflict with active Portfolio constraints.
  - Channel and customer segment eligibility rules are consistent across bundled components.

---

## 3. Portfolio Management Requirements

### REQ-2.1 Portfolio as a Time-Bound Container
- A **Portfolio** **shall** represent a time-bound commercial release container organizing Vodafone Germany's commercial offerings for a defined **timeframe** (effective start/end dates).
- A Portfolio **shall** support a **preparation period** prior to its commercial launch date to accommodate authoring, approvals, and any required technical model changes.

### REQ-2.2 Portfolio Lifecycle
- Portfolios **shall** follow a macro-lifecycle: `Planning` → `Preparation` → `Readiness Check` → `Active / Launched` → `Sunset / Archived`.
- Launching a new Portfolio **shall** support introducing new business portfolios without disrupting currently active portfolios.

### REQ-2.3 Portfolio-to-Entity Linkage & Launch Gate
- Commercial entities **shall** support an **N:M relationship** with Portfolios, where each Portfolio links to a specific effective version/draft for that Portfolio's timeframe.
- The Portfolio **Readiness Check** gate **shall** block launch by default if any linked commercial entity is not `Ready`.
- The system **shall** allow an authorized **Portfolio Manager** to explicitly **defer/unlink** incomplete entities to a future Portfolio (with audit reason) so the remaining ready entities can launch on schedule.

---

## 4. Versioning & Draft Management

### REQ-3.1 Draft-First Creation & Updates
- Creating a new commercial entity or updating an existing one **shall** always produce a **Draft version** (`vN+1-draft`), isolating in-progress changes from the currently active/published catalog.
- The system **shall** enforce **at most one active draft per `(Entity, Target Portfolio)`**.
- When creating an update draft for an existing entity, the system **shall** clone from the latest approved/active version and surface **conflict warnings** if another active draft or published version overlaps the target Portfolio's timeframe.

### REQ-3.2 Promotion & Effective Dating
- A Draft version **shall** only transition to `Ready` and subsequently `Active / Published` after completing all required DAG steps and Technical Dependency gates.
- Published versions **shall** retain immutable version history and support time-bound activation aligned with the linked Portfolio.

---

## 5. Multi-Step, Role-Based Workflow (DAG)

### REQ-4.1 Configurable DAG Execution
- Both **Creation** and **Update** flows **shall** execute on a configurable **Directed Acyclic Graph (DAG)** supporting sequential gates and parallel branches (e.g., *Pricing* and *Legal/Compliance* running in parallel after *Commercial Definition*).
- **Update flows** **shall** be delta-aware, allowing unchanged impact steps (e.g., Legal or Technical Feasibility when only commercial copy changes) to be skipped or auto-passed based on configurable impact rules.

### REQ-4.2 Role-Based Ownership & Handoffs
- Each step in a creation or update DAG **shall** be assignable to a specific **person or role** (e.g., Product Manager, Pricing Specialist, Technical Architect, Legal/Compliance, Release Manager).
- A step **shall** only be advanced or signed off by an authorized owner for that step.
- The system **shall** support rejection/send-back loops to previous steps with mandatory comments/reasons, re-opening downstream steps as needed.

### REQ-4.3 Auditability & Traceability
- The system **shall** maintain a complete audit log of all step transitions, ownership handoffs, approvals, rejections, portfolio deferrals, draft diffs, and technical dependency status changes.

---

## 6. Non-Functional & Governance Requirements

### REQ-5.1 Separation of Commercial & Technical Tooling
- Technical dependency tracking **shall** integrate via references/contracts (technical model ID, target version, external change-request/ticket ID, webhook/API status) rather than duplicating technical catalog authoring inside the PLM tool.

### REQ-5.2 Impact & Readiness Visibility
- Portfolio Managers **shall** have a consolidated readiness dashboard showing:
  - Linked commercial entities and their current DAG step(s).
  - Bottlenecked steps by role/owner.
  - Open technical model dependencies blocking launch.
  - Countdown against the Portfolio's preparation deadline.

---

## 7. Integration Requirements (Portfolio Status Changes)

### REQ-6.1 Inbound & Outbound Integrations on Portfolio Status Changes
- Portfolio status transitions (`Planning` → `Preparation` → `Readiness Check` → `Active` → `Sunset` → `Archived`) **shall** support triggering **outbound integrations** (e.g., kickoff notifications, technical CR dispatch, staging pre-launch sync, production catalog publish, sunset/end-of-sale signals, archive audit snapshots).
- Portfolio steps **shall** support receiving **inbound integrations** (e.g., enterprise planning sync, technical model readiness webhooks, compliance clearance callbacks, channel activation acknowledgements).

### REQ-6.2 Backend Integration Folder & Step Visibility
- The backend **shall** maintain a dedicated `backend/integration/` module where all Portfolio lifecycle steps and their associated inbound/outbound integration definitions can be viewed and queried via API (`GET /api/integration/portfolio/steps` and `GET /api/integration/portfolio/steps/:status`).

