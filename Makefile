.PHONY: frontend admin backend

frontend:
	cd frontend && npm ci && npm run dev

admin:
	cd admin && npm ci && npm run dev

backend:
	cd backend && python -m venv .venv && . .venv/bin/activate && pip install -r requirements.txt && uvicorn app.main:app --reload --port 8000

dev: frontend backend
