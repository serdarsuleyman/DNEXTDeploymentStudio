# Vodafone DNEXT Cloud Deployment Studio

A standalone, fully decoupled management and publishing suite for **Vodafone Germany TMF 620 Product Catalog APIs** and **DNEXT Cloud Environments**.

---

## 🌟 Key Features

1. **🚀 Deployment Packages & Item Matrix**:
   - Manage release packages (`vf-germany-poc`, `POC_V2`, custom release packages).
   - Filter by entity type (`ProductOffering`, `ProductOfferingPrice`, `BundledProductOfferingPrice`, `ProductSpecification`), offer category (`TV`, `Hardware`, `FiberConnectivity`, `RegioSurcharge`, etc.), and sync status (`pending`, `synced`, `error`).
   - One-click bulk deployment to DNEXT Cloud with automated Version 0 (`In study`) ➔ Version 1 (`Launched`) sequence.
   - Comprehensive entity purging with cross-version lifecycle patch to `Obsolete` before deletion.

2. **📂 Category Cloud Sync**:
   - Bi-directional diffing between local fixed-net catalog reference specifications and remote Keycloak/DPC endpoints.
   - Hierarchical category push with parent UUID resolution.

3. **⚙️ Target Environment Switcher**:
   - Multi-tenant cloud environment support (DEV, TEST, STAGE).
   - Dynamic URL and Keycloak realm token handling with real-time error auditing.

---

## 📁 Architecture & Standalone Portability

This entire `dnext-deployment-studio/` folder is **completely standalone** and self-contained:
- Can be copied/pasted to any directory, machine, or git repository.
- Uses its own dedicated SQLite database: `backend/data/dnext_deployment.db`.
- Contains all TMF 620 JSON payloads under `tmf_packages/`.

```text
dnext-deployment-studio/
├── package.json                   # Root command runner
├── README.md                      # This documentation
├── backend/                       # Express API Server (Port 3002)
│   ├── server.js                  # App bootstrap
│   ├── config.json                # Saved environments
│   ├── data/
│   │   ├── dnext_deployment.db    # Dedicated SQLite Database
│   │   ├── local_categories.json  # Category reference data
│   ├── routes/                    # Modular API endpoints
│   ├── services/                  # Database, Proxy client & Generator engine
│   └── logs/                      # Error and debug logs
├── frontend/                      # Vite + React UI (Port 5174)
│   ├── vite.config.js             # Proxies /api -> http://localhost:3002
│   └── src/
│       ├── App.jsx                # Studio top bar & workspace switcher
│       └── components/            # Studio dashboard components
└── tmf_packages/                  # JSON Payload Repository
    ├── TMFVersion2/               # Active offerings, POPs & bundles
    └── specification/             # Product specifications
```

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm run install:all
```
*(Or `npm install` inside both `backend/` and `frontend/`)*

### 2. Start & Stop Scripts

You can use the dedicated control scripts to easily start, stop, restart, or inspect the studio:

```bash
# Start both Backend & Frontend in background
./start.sh
# or
./studio.sh start

# Check application status (PIDs and Port health)
./studio.sh status

# Stop both Backend & Frontend cleanly
./stop.sh
# or
./studio.sh stop

# Restart application
./studio.sh restart

# Tail live application logs
./studio.sh logs
```

Alternatively, run in the foreground with interactive console output:
```bash
npm run dev
```

The application will be accessible at:
- **Frontend Studio UI**: [http://localhost:5174](http://localhost:5174)
- **Backend API Server**: [http://localhost:3002](http://localhost:3002)

---

## 🔌 API Endpoints Reference

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/dnext/auth/login` | Authenticate with Keycloak realm |
| `GET` | `/api/dnext/environments` | List saved target environments |
| `POST` | `/api/dnext/environments` | Save/update target cloud environment |
| `GET` | `/api/dnext-deployment-package` | List all deployment packages with item counts |
| `POST` | `/api/dnext-deployment-package` | Create a new deployment package |
| `GET` | `/api/dnext-deployment-item` | List deployment items (with filtering) |
| `POST` | `/api/dnext-deployment-item/reset` | Scan `tmf_packages/` and re-seed database |
| `PATCH` | `/api/dnext-deployment-item/:id` | Update entity sync status |
| `POST` | `/api/dnext/product-offerings` | Publish offering with V0 ➔ V1 sequence |
| `POST` | `/api/dnext/product-specifications` | Publish spec with V0 ➔ V1 sequence |
| `POST` | `/api/dnext/product-offering-prices` | Publish POP with V0 ➔ V1 sequence |
| `POST` | `/api/dnext/purge-entity` | Patch Launched to Obsolete and delete across all versions |
| `GET` | `/api/sales-package/presets` | Get commercial preset templates |
| `POST` | `/api/sales-package/generate` | Generate TMF 620 JSON tree and register in DB |
| `GET` | `/api/static-file` | Inspect raw local JSON payload |

---

## 📄 License
Vodafone Germany Product Catalog & Cloud Architecture Team.
