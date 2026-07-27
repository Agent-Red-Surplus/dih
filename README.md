# dih

This repository contains a monorepo scaffold for a web-based 3D incremental game.

Structure:
- `frontend/` — React + Three.js game client (Vite)
- `admin/` — Vue3 admin dashboard (Vite)
- `backend/` — FastAPI backend
- `unity/` — Unity/C# integration placeholder

See DESIGN.md for architecture and progression details.

Local development

Front-end:

```bash
cd frontend
npm install
npm run dev
```

Admin dashboard:

```bash
cd admin
npm install
npm run dev
```

Backend:

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

The frontend will attempt to save/load to `http://localhost:8000` by default. You can set `window.__API_BASE__` in the page to point to another backend.