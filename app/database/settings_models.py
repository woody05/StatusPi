from enum import IntEnum
from typing import Optional, List, Dict, Any
from sqlalchemy import String, Integer, ForeignKey, JSON, event
from sqlalchemy.engine import Engine
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship
from sqlalchemy.types import TypeDecorator
from flask_sqlalchemy import SQLAlchemy

# Initialize Flask-SQLAlchemy instance
class Base(DeclarativeBase):
    pass

db = SQLAlchemy(model_class=Base)


# Ensure Foreign Keys work in SQLite
@event.listens_for(Engine, "connect")
def set_sqlite_pragma(dbapi_connection, connection_record):
    cursor = dbapi_connection.cursor()
    cursor.execute("PRAGMA foreign_keys=ON")
    cursor.close()


class SettingValueType(IntEnum):
    string = 0
    integer = 1
    float = 3
    boolean = 4
    select = 5
    selectmultiple = 6
    datetime = 7
    textarea = 8


class IntEnumType(TypeDecorator):
    """Custom SQLAlchemy type decorator to store Python IntEnums as integers in SQLite."""

    impl = Integer
    cache_ok = True

    def __init__(self, enum_cls, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.enum_cls = enum_cls

    def process_bind_param(self, value, dialect):
        if value is None:
            return None
        if isinstance(value, self.enum_cls):
            return value.value
        return int(value)

    def process_result_value(self, value, dialect):
        if value is None:
            return None
        return self.enum_cls(value)


class SettingsGroup(Base):
    __tablename__ = "settings_group"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(String(255), nullable=False)

    settings: Mapped[List["SettingsModel"]] = relationship(
        "SettingsModel",
        back_populates="group",
        cascade="all, delete-orphan",
    )

    def to_dict(self, include_settings: bool = True) -> Dict[str, Any]:
        """Convert group model to a JSON-serializable dictionary."""
        data = {
            "id": self.id,
            "name": self.name,
            "description": self.description,
        }
        if include_settings:
            data["settings"] = [s.to_dict() for s in self.settings]
        return data


class SettingsModel(Base):
    __tablename__ = "settings"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(50), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    setting_key: Mapped[str] = mapped_column(String(50), nullable=False, unique=True)

    value_type: Mapped[SettingValueType] = mapped_column(
        IntEnumType(SettingValueType), nullable=False
    )

    value: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)

    settings_group_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("settings_group.id", ondelete="CASCADE"),
        nullable=False,
    )

    group: Mapped["SettingsGroup"] = relationship("SettingsGroup", back_populates="settings")

    def to_dict(self) -> Dict[str, Any]:
        """Convert setting model to a JSON-serializable dictionary."""
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "setting_key": self.setting_key,
            "value_type": self.value_type.name,       # e.g., 'string', 'integer'
            "value_type_code": self.value_type.value, # e.g., 0, 1
            "value": self.value,
            "settings_group_id": self.settings_group_id,
        }