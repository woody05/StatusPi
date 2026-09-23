import sqlite3
from enum import StrEnum
from flask import Flask


class LogLevel(StrEnum):
    DEBUG = "DEBUG"
    INFO = "INFO"
    WARNING = "WARNING"
    ERROR = "ERROR"
    CRITICAL = "CRITICAL"


class Logger:

    def __init__(self, app: Flask = None, db: str = None):
        self.db = None
        if db or app:
            self.init_app(db=db, app=app)

    def init_app(self,app: Flask, db: str = None) -> None:
        if not db:
            raise ValueError("No db config provided")

        self.db = db

        with sqlite3.connect(self.db) as conn:
            conn.execute("PRAGMA journal_mode = WAL;")
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp DATETIME DEFAULT (datetime('now', 'localtime')),
                level TEXT,
                message TEXT
            )
            """
            )

        if app is not None:
            app.logger = self

    def _write_log(self, level: LogLevel, message: str) -> None:
        if not self.db:
            raise RuntimeError("No logger db is configured")

        with sqlite3.connect(self.db) as conn:
            conn.execute(
                "INSERT INTO logs (level, message) VALUES (?, ?)",
                (str(level), message),
            )

    # --- Log Level Methods ---

    def debug(self, message: str) -> None:
        self._write_log(LogLevel.DEBUG, message)

    def info(self, message: str) -> None:
        self._write_log(LogLevel.INFO, message)

    def warning(self, message: str) -> None:
        self._write_log(LogLevel.WARNING, message)

    def error(self, message: str) -> None:
        self._write_log(LogLevel.ERROR, message)

    def critical(self, message: str) -> None:
        self._write_log(LogLevel.CRITICAL, message)