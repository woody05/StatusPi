from datetime import datetime
from typing import Optional, Union


class Log:
    def __init__(
        self,
        id: Optional[int],
        timestamp: Union[str, datetime],
        level: str,
        message: str
    ):
        self.id = id
        # Convert datetime object to ISO string format if passed directly
        if isinstance(timestamp, datetime):
            self.timestamp = timestamp.isoformat(sep=" ", timespec="seconds")
        else:
            self.timestamp = str(timestamp)
            
        self.level = level.upper() if level else "INFO"
        self.message = message

    def __repr__(self) -> str:
        return f"<Log(id={self.id}, timestamp='{self.timestamp}', level='{self.level}', message='{self.message}')>"

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "timestamp": self.timestamp,
            "level": self.level,
            "message": self.message
        }

    @classmethod
    def from_dict(cls, data: dict) -> "Log":
        return cls(
            id=data.get("id"),
            timestamp=data.get("timestamp", ""),
            level=data.get("level", "INFO"),
            message=data.get("message", "")
        )