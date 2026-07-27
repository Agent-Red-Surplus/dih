from fastapi import FastAPI
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
import os
import json

app = FastAPI(title="DIH Backend")

# allow CORS for development and deploy flexibility; tighten in production
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DATA_DIR = os.path.join(os.path.dirname(__file__), '..', 'data')
os.makedirs(DATA_DIR, exist_ok=True)


class SavePayload(BaseModel):
    player_id: str
    data: dict


@app.post('/save')
async def save(payload: SavePayload):
    path = os.path.join(DATA_DIR, f"{payload.player_id}.json")
    try:
        with open(path, 'w') as f:
            json.dump({'player_id': payload.player_id, 'data': payload.data}, f)
        return {"ok": True}
    except Exception as e:
        return {"ok": False, "error": str(e)}


@app.get('/load/{player_id}')
async def load(player_id: str):
    path = os.path.join(DATA_DIR, f"{player_id}.json")
    if not os.path.exists(path):
        return {"player_id": player_id, "data": {}}
    try:
        with open(path, 'r') as f:
            obj = json.load(f)
        return obj
    except Exception as e:
        return {"player_id": player_id, "data": {}, "error": str(e)}


@app.get('/health')
async def health():
    return {"status": "ok"}


# Admin tuning storage
DEFAULT_TUNING = {
    "auto_base_cost": 50,
    "auto_cost_scaling": 25,
    "click_base_cost": 20,
    "click_value": 1,
    "click_multiplier_cost_base": 2
}


@app.get('/admin/tuning')
async def get_tuning():
    path = os.path.join(DATA_DIR, 'admin_tuning.json')
    if not os.path.exists(path):
        return {"tuning": DEFAULT_TUNING}
    try:
        with open(path, 'r') as f:
            obj = json.load(f)
        return {"tuning": obj.get('tuning', DEFAULT_TUNING)}
    except Exception as e:
        return {"tuning": DEFAULT_TUNING, "error": str(e)}


@app.post('/admin/tuning')
async def set_tuning(payload: dict):
    path = os.path.join(DATA_DIR, 'admin_tuning.json')
    try:
        with open(path, 'w') as f:
            json.dump({'tuning': payload}, f)
        return {"ok": True}
    except Exception as e:
        return {"ok": False, "error": str(e)}


@app.post('/leaderboard')
async def submit_score(payload: dict):
    """Accepts {player_id, score} and appends to a simple leaderboard file."""
    path = os.path.join(DATA_DIR, 'leaderboard.json')
    try:
        board = []
        if os.path.exists(path):
            with open(path, 'r') as f:
                board = json.load(f)
        entry = {'player_id': payload.get('player_id'), 'score': float(payload.get('score', 0)), 'ts': int(__import__('time').time())}
        board.append(entry)
        # keep top 100 by score
        board = sorted(board, key=lambda x: -x['score'])[:100]
        with open(path, 'w') as f:
            json.dump(board, f)
        return {'ok': True}
    except Exception as e:
        return {'ok': False, 'error': str(e)}


@app.get('/leaderboard')
async def get_leaderboard():
    path = os.path.join(DATA_DIR, 'leaderboard.json')
    if not os.path.exists(path):
        return {'board': []}
    try:
        with open(path, 'r') as f:
            board = json.load(f)
        return {'board': board}
    except Exception as e:
        return {'board': [], 'error': str(e)}
