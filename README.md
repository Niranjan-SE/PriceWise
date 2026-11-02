# PriceWise India

Live price comparison for Indian shoppers. Pulls prices from Amazon and 10+ retailers, stores history in PostgreSQL, and surfaces discount checks and buy advice.

**Live:** [price-wise-xi.vercel.app](https://price-wise-xi.vercel.app)

## Stack

| Layer | Tech |
|---|---|
| Frontend | Next.js, React, Tailwind CSS, Recharts |
| Backend | Python, FastAPI, httpx |
| Data | PostgreSQL |
| Insights | Gemini |
| Hosting | Vercel (frontend), Railway (backend) |

## What it does

- Fetches prices from Amazon and 10+ Indian retailers concurrently
- Stores price history in PostgreSQL
- Exposes comparison, discount-check and buy-advice REST endpoints
- Next.js UI for search, comparison and purchase insights

## Repo layout

```
PriceWise/
├── frontend/    Next.js app
└── backend/     FastAPI API
```

## Run locally

**Backend**

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
# set DATABASE_URL and Gemini credentials in .env
uvicorn main:app --reload --port 8000
```

**Frontend**

```bash
cd frontend
npm install
npm run dev
```
