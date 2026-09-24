"""Prediction history stored in a small SQLite file (backend/data/history.db)."""
import json
import sqlite3
from datetime import datetime
from pathlib import Path


class HistoryStore:
    def __init__(self, path: Path):
        self.path = Path(path)
        self.path.parent.mkdir(parents=True, exist_ok=True)
        with self._connect() as con:
            con.execute("""CREATE TABLE IF NOT EXISTS predictions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                created_at TEXT, field_key TEXT, month TEXT,
                predicted REAL, actual REAL, inputs TEXT)""")

    def _connect(self):
        return sqlite3.connect(self.path)

    def add(self, result: dict, inputs: dict) -> int:
        with self._connect() as con:
            cur = con.execute(
                "INSERT INTO predictions (created_at, field_key, month, predicted, actual, inputs)"
                " VALUES (?, ?, ?, ?, ?, ?)",
                (datetime.now().isoformat(timespec="seconds"), result["field_key"],
                 result["prediction_month"], result["prediction"],
                 result["actual_yield"], json.dumps(inputs)))
            return cur.lastrowid

    def list(self, limit: int = 200):
        with self._connect() as con:
            rows = con.execute(
                "SELECT id, created_at, field_key, month, predicted, actual FROM predictions"
                " ORDER BY id DESC LIMIT ?", (limit,)).fetchall()
        return [{"id": r[0], "created_at": r[1], "field_key": r[2], "month": r[3],
                 "predicted": r[4], "actual": r[5],
                 "status": "Completed" if r[5] is not None else "Predicted"} for r in rows]
