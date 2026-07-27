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

The frontend and admin apps will attempt to save/load to `http://localhost:8000` by default. You can set `window.__API_BASE__` in the page, or better yet define `VITE_API_BASE` during deployment to point to a deployed backend.

A quick guide to build, test, and deploy the project locally and via CI:

Commands
```bash
# frontend
cd frontend
npm install
npm run build

# admin
cd admin
npm install
npm run build

# backend (run locally)
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload

# run balancing simulation
node scripts/balance.js
```

Deploy
- GitHub Pages: workflow at `.github/workflows/pages-deploy.yml` builds both `frontend/dist` and `admin/dist` and deploys using Pages artifacts. No extra secrets are required for GitHub Pages deploys.
  - Set `VITE_API_BASE` in GitHub repository secrets if your backend is deployed to a different host.

Security note: never paste private secrets into chat, issue descriptions, or source files. Add deployment tokens and private API URLs only through GitHub repository secrets under Settings > Secrets and variables.