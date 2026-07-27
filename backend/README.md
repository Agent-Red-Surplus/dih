# Backend (FastAPI)

Run locally:

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

This exposes `/save`, `/load/{player_id}`, and `/health` endpoints.
