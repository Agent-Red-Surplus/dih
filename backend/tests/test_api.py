import os
import json
import sys
from fastapi.testclient import TestClient

# ensure backend package on path
sys.path.append(os.path.dirname(os.path.dirname(__file__)))
from app.main import app, DATA_DIR

client = TestClient(app)

def test_health():
    res = client.get('/health')
    assert res.status_code == 200
    assert res.json().get('status') == 'ok'

def test_save_and_load(tmp_path, monkeypatch):
    # redirect data dir to tmp
    monkeypatch.setattr('app.main.DATA_DIR', str(tmp_path))
    payload = {'player_id': 'test_player', 'data': {'resources': 123}}
    r = client.post('/save', json=payload)
    assert r.status_code == 200
    assert r.json().get('ok')
    r2 = client.get('/load/test_player')
    assert r2.status_code == 200
    assert r2.json().get('data', {}).get('resources') == 123

def test_leaderboard(tmp_path, monkeypatch):
    monkeypatch.setattr('app.main.DATA_DIR', str(tmp_path))
    r = client.post('/leaderboard', json={'player_id': 'p1', 'score': 10})
    assert r.status_code == 200 and r.json().get('ok')
    r = client.post('/leaderboard', json={'player_id': 'p2', 'score': 20})
    assert r.status_code == 200
    lb = client.get('/leaderboard')
    assert lb.status_code == 200
    board = lb.json().get('board')
    assert isinstance(board, list) and board[0]['player_id'] == 'p2'
