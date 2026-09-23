import sqlite3
from typing import Optional
from flask import Flask
from app.models.log import Log  # Adjust import path as needed


class LogReader:
    def __init__(self, app: Flask = None, db_path: str = None):
        self.db_path = db_path
        if app is not None:
            self.init_app(app)

    def init_app(self, app: Flask, db_path: str = None):
        app.log_reader = self
        if db_path:
            self.db_path = db_path
        elif not self.db_path:
            self.db_path = getattr(app.logger, 'db', '/tmp/flask_logs.db')

    def fetch_logs(
        self, 
        limit: int = 50, 
        page: int = 1, 
        level: Optional[str] = None,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None
    ) -> list[Log]:
        if not self.db_path:
            raise RuntimeError("LogReader is not initialized with a database path.")

        offset = (page - 1) * limit
        query = "SELECT id, timestamp, level, message FROM logs"
        where_clauses = []
        params = []

        if level:
            where_clauses.append("level = ?")
            params.append(level.upper())

        # Normalize start_date (append :00 if missing seconds)
        if start_date:
            clean_start = start_date.replace('T', ' ')
            if len(clean_start) == 16:  # YYYY-MM-DD HH:MM
                clean_start += ":00"
            where_clauses.append("datetime(timestamp) >= datetime(?)")
            params.append(clean_start)

        # Normalize end_date (append :59 if missing seconds)
        if end_date:
            clean_end = end_date.replace('T', ' ')
            if len(clean_end) == 16:  # YYYY-MM-DD HH:MM
                clean_end += ":59"
            where_clauses.append("datetime(timestamp) <= datetime(?)")
            params.append(clean_end)

        if where_clauses:
            query += " WHERE " + " AND ".join(where_clauses)

        query += " ORDER BY id DESC LIMIT ? OFFSET ?"
        params.extend([limit, offset])

        with sqlite3.connect(f"file:{self.db_path}?mode=ro", uri=True) as conn:
            conn.row_factory = sqlite3.Row
            rows = conn.execute(query, params).fetchall()
            return [
                Log(
                    id=row["id"],
                    timestamp=row["timestamp"],
                    level=row["level"],
                    message=row["message"]
                )
                for row in rows
            ]