# 🧠 Crypto Intelligence Platform (CIP)

AI-assisted market intelligence and risk monitoring for digital assets.

> **Disclaimer:** CIP is a research and intelligence tool. It does not provide investment advice, price predictions, or guarantee any financial outcomes.

---

## Features

| Feature | Description |
|---|---|
| **Dashboard** | Top 20 assets with live price, market cap, volume, and sentiment |
| **Asset Research** | Deep-dive metrics: market, protocol (TVL), liquidity, risk scores |
| **Comparison Tool** | Side-by-side asset comparison with AI analysis and radar chart |
| **Risk Monitor** | Quantitative risk scores (Liquidity / Concentration / Ecosystem) |
| **Alert Center** | Automated alerts for liquidity drops, TVL drops, volume spikes |
| **AI Copilot** | On-demand AI research reports: summary, opportunities, risks |

---

## Tech Stack

**Frontend** — React + TypeScript + Vite + Tailwind CSS + shadcn/ui + Recharts + React Query  
**Backend** — FastAPI + Python + SQLAlchemy (async) + PostgreSQL + APScheduler  
**AI Layer** — OpenRouter → DeepSeek Chat (abstracted, swappable)  
**Data Sources** — CoinGecko · DefiLlama · DexScreener · Alternative.me (all free)

---

## Quick Start (Docker)

### Prerequisites
- Docker + Docker Compose
- OpenRouter API key (free tier at openrouter.ai)

```bash
# 1. Clone & enter project
git clone <your-repo>
cd cip

# 2. Set environment variables
cp backend/.env.example backend/.env
# Edit backend/.env and set OPENROUTER_API_KEY

# 3. Start all services
docker-compose up -d

# 4. Seed sample data (first time only)
docker-compose exec backend python seed.py

# 5. Open the app
open http://localhost:5173
```

API docs available at: http://localhost:8000/docs

---

## Manual Setup

### Backend

**Requirements:** Python 3.12+, PostgreSQL 14+

```bash
cd backend

# Create virtualenv
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env: set DATABASE_URL and OPENROUTER_API_KEY

# Start backend
uvicorn main:app --reload --port 8000
```

On first start, tables are created automatically. To seed sample data:
```bash
python seed.py
```

### Frontend

**Requirements:** Node.js 18+

```bash
cd frontend

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# VITE_API_URL can stay empty (uses Vite proxy to localhost:8000)

# Start dev server
npm run dev
```

Open http://localhost:5173

---

## Deployment

### Backend → Render

1. Create a new **Web Service** on Render
2. Connect your GitHub repo, set root to `backend/`
3. Build command: `pip install -r requirements.txt`
4. Start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
5. Add environment variables:
   - `DATABASE_URL` → your Neon PostgreSQL connection string
   - `OPENROUTER_API_KEY` → your OpenRouter key
   - `ENVIRONMENT` → `production`
   - `ALLOWED_ORIGINS` → `["https://your-app.vercel.app"]`

### Database → Neon PostgreSQL

1. Create a free project at neon.tech
2. Copy the connection string (use the `postgresql+asyncpg://` format)
3. Set as `DATABASE_URL` in your Render environment variables

### Frontend → Vercel

1. Import your repo on vercel.com
2. Set root directory to `frontend/`
3. Add environment variable:
   - `VITE_API_URL` → `https://your-cip-backend.onrender.com`
4. Deploy — Vercel auto-detects Vite

---

## Architecture

```
cip/
├── backend/
│   ├── main.py                    # FastAPI app entry point
│   ├── core/
│   │   ├── config.py              # Settings from env vars
│   │   └── database.py            # Async SQLAlchemy engine
│   ├── models/__init__.py         # SQLAlchemy ORM models
│   ├── schemas/__init__.py        # Pydantic request/response schemas
│   ├── repositories/__init__.py   # Database access layer
│   ├── services/
│   │   ├── coingecko.py           # CoinGecko API client
│   │   ├── external_apis.py       # DefiLlama, DexScreener, Alternative.me
│   │   ├── llm.py                 # LLM abstraction (OpenRouter)
│   │   └── risk_engine.py         # Risk score computation
│   ├── api/routes/
│   │   ├── assets.py              # GET /assets, GET /assets/{id}
│   │   ├── alerts.py              # GET /alerts, POST /alerts/{id}/read
│   │   ├── risk_scores.py         # GET /risk-scores
│   │   ├── research.py            # GET /research/reports, POST /research/generate
│   │   ├── compare.py             # GET /compare
│   │   └── health.py              # GET /health
│   ├── etl/
│   │   ├── scheduler.py           # APScheduler job registration
│   │   └── jobs.py                # ETL implementations
│   └── seed.py                    # Sample data seeder
│
└── frontend/
    └── src/
        ├── types/index.ts         # TypeScript type definitions
        ├── lib/
        │   ├── api.ts             # React Query hooks + API client
        │   └── utils.ts           # Formatters and utilities
        ├── components/
        │   ├── Sidebar.tsx        # Navigation sidebar
        │   └── ui/shared.tsx      # Reusable UI components
        └── pages/
            ├── Dashboard.tsx      # Main dashboard with asset table
            ├── Assets.tsx         # Sortable/searchable asset list
            ├── AssetDetail.tsx    # Full asset research page
            ├── Compare.tsx        # Side-by-side comparison
            ├── Risk.tsx           # Risk monitor with charts
            ├── Alerts.tsx         # Alert center
            └── Research.tsx       # Research reports + AI copilot
```

---

## ETL Schedule

| Job | Frequency | Data |
|---|---|---|
| Market Refresh | Every 1 hour | CoinGecko prices, volumes, FGI |
| Protocol Refresh | Every 6 hours | DefiLlama TVL, DexScreener liquidity |
| Research Reports | Every 24 hours | AI-generated reports for top 10 assets |

Alert checks run on every market refresh and compare against the previous snapshot.

---

## Risk Score Methodology

All scores range **0–100** (higher = more risk):

| Component | Weight | Factors |
|---|---|---|
| **Liquidity Risk** | 40% | Absolute DEX liquidity, liquidity/market cap ratio, vol/liq ratio |
| **Concentration Risk** | 30% | Market cap rank, single-chain TVL concentration |
| **Ecosystem Risk** | 30% | TVL trend, Fear & Greed Index, 7-day price momentum |

Overall Risk = `Liquidity × 0.40 + Concentration × 0.30 + Ecosystem × 0.30`

---

## Environment Variables

### Backend (`backend/.env`)

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | ✅ | PostgreSQL async URL (`postgresql+asyncpg://...`) |
| `OPENROUTER_API_KEY` | ⚠️ | OpenRouter key (AI features disabled without it) |
| `ENVIRONMENT` | ❌ | `development` or `production` (default: `development`) |
| `ALLOWED_ORIGINS` | ❌ | JSON array of allowed CORS origins |

### Frontend (`frontend/.env`)

| Variable | Required | Description |
|---|---|---|
| `VITE_API_URL` | ❌ | Backend URL (empty = use Vite proxy in dev) |

---

## AI Layer

The LLM abstraction (`services/llm.py`) supports swappable providers. Default: OpenRouter → DeepSeek Chat.

To change model, update `DEFAULT_LLM_MODEL` in `.env`:
```
DEFAULT_LLM_MODEL=anthropic/claude-3-haiku
DEFAULT_LLM_MODEL=openai/gpt-4o-mini
DEFAULT_LLM_MODEL=deepseek/deepseek-chat   # default, free tier available
```

The AI system prompt strictly prohibits price predictions and investment recommendations.

---

## API Reference

Full OpenAPI docs at `/docs` (Swagger UI) and `/redoc`.

| Endpoint | Method | Description |
|---|---|---|
| `/assets/` | GET | Top assets with market metrics |
| `/assets/{id}` | GET | Full asset detail (all metrics) |
| `/compare/` | GET | Compare two assets (`?asset_a=bitcoin&asset_b=ethereum`) |
| `/risk-scores/` | GET | All latest risk scores |
| `/risk-scores/{id}` | GET | Risk score for specific asset |
| `/alerts/` | GET | Recent alerts (`?unread_only=true`) |
| `/alerts/{id}/read` | POST | Mark alert as read |
| `/research/reports` | GET | Latest research report per asset |
| `/research/generate` | POST | Generate fresh AI report |
| `/health/` | GET | Health check |

---

## License

MIT
