# db_manager.py
from contextlib import contextmanager
from typing import Type, TypeVar, Optional, List, Any, Dict
from sqlalchemy.orm import Session
from .settings_models import db, SettingsGroup, SettingsModel, SettingValueType

T = TypeVar("T")


class DatabaseManager:
    """Centralized database context manager and repository wrapper."""

    @staticmethod
    @contextmanager
    def session_scope():
        """Transactional context manager.
        Automatically commits on success or rolls back on exceptions.
        """
        session: Session = db.session
        try:
            yield session
            session.commit()
        except Exception as e:
            session.rollback()
            raise e

    # --- Common CRUD Helpers ---

    @classmethod
    def create(cls, model_instance: Any) -> Any:
        """Add and commit a new model instance."""
        with cls.session_scope() as session:
            session.add(model_instance)
            session.flush()
            session.refresh(model_instance)
            return model_instance

    @classmethod
    def get_by_id(cls, model: Type[T], record_id: int) -> Optional[T]:
        """Fetch a single record by primary key."""
        return db.session.get(model, record_id)

    @classmethod
    def delete(cls, model: Type[T], record_id: int) -> bool:
        """Delete a record by primary key."""
        with cls.session_scope() as session:
            instance = session.get(model, record_id)
            if instance:
                session.delete(instance)
                return True
            return False

    # --- Group Domain Methods ---

    @classmethod
    def get_group_by_name(cls, name: str) -> Optional[SettingsGroup]:
        """Find a single SettingsGroup by name."""
        stmt = db.select(SettingsGroup).filter_by(name=name)
        return db.session.scalar(stmt)

    @classmethod
    def get_all_groups_with_settings(cls) -> List[SettingsGroup]:
        """Fetch all groups with their settings populated."""
        stmt = db.select(SettingsGroup)
        return list(db.session.scalars(stmt).all())

    @classmethod
    def create_group(cls, name: str, description: str = "") -> Dict[str, Any]:
        """Create a new group and return its serialized dict."""
        with cls.session_scope() as session:
            new_group = SettingsGroup(name=name, description=description)
            session.add(new_group)
            session.flush()
            return new_group.to_dict(include_settings=False)

    # --- Setting Domain Methods ---

    @classmethod
    def get_setting_by_key(cls, key: str) -> Optional[SettingsModel]:
        """Find a setting by its unique setting_key."""
        stmt = db.select(SettingsModel).filter_by(setting_key=key)
        return db.session.scalar(stmt)

    @classmethod
    def update_setting_value(cls, key: str, new_value: Any) -> bool:
        """Update a specific setting's value."""
        with cls.session_scope() as session:
            setting = session.scalar(db.select(SettingsModel).filter_by(setting_key=key))
            if setting:
                setting.value = str(new_value)
                return True
            return False

    @classmethod
    def create_setting(
        cls,
        name: str,
        description: str,
        setting_key: str,
        value_type: SettingValueType,
        value: Any,
        settings_group_id: int
    ) -> Dict[str, Any]:
        """Create a new setting and return its serialized dict."""
        with cls.session_scope() as session:
            new_setting = SettingsModel(
                name=name,
                description=description,
                setting_key=setting_key,
                value_type=value_type,
                value=str(value),
                settings_group_id=settings_group_id
            )
            session.add(new_setting)
            session.flush()
            return new_setting.to_dict()

    @classmethod
    def get_statuses(cls) -> Optional[List[Dict[str, Any]]]:
        """Fetch all settings belonging to the 'Statuses' group."""
        status_group = cls.get_group_by_name("Statuses")
        if not status_group:
            return None
        return [setting.to_dict() for setting in status_group.settings]

    @classmethod
    def add_status(cls, name: str, setting_key: str, value: Any, description: Optional[str] = None) -> Optional[Dict[str, Any]]:
        """Add a status setting directly under the 'Statuses' group."""
        status_group = cls.get_group_by_name("Statuses")
        if not status_group:
            return None

        desc = description if description else f"The status for when {name.lower()}"
        return cls.create_setting(
            name=name,
            description=desc,
            setting_key=setting_key,
            value_type=SettingValueType.string,
            value=value,
            settings_group_id=status_group.id
        )

    # --- Database Seeding ---

    @classmethod
    def seed_database(cls) -> bool:
        """Seed initial groups and default settings if not already seeded."""
        if cls.get_setting_by_key("default_mode"):
            return False  # Already seeded

        with cls.session_scope() as session:
            default_grp = SettingsGroup(
                name="Default settings",
                description="Global default configurations for initial modes and brightness"
            )
            statuses_grp = SettingsGroup(
                name="Statuses",
                description="Status options and their associated RGB color values"
            )
            intervals_grp = SettingsGroup(
                name="Mode Intervals",
                description="Timing interval settings for light pattern modes"
            )

            session.add_all([default_grp, statuses_grp, intervals_grp])
            session.flush()

            default_settings = [
                # Default settings
                ("default mode", "The default mode to set when light turns on", "default_mode", SettingValueType.string, "SOLID", default_grp.id),
                ("default brightness", "The default brightness level for the lights", "default_brightness", SettingValueType.integer, "80", default_grp.id),
                ("default status", "The default status when initialized", "default_status", SettingValueType.string, "Available", default_grp.id),
                
                # Status options
                ("Available", "The status for when available", "available_status", SettingValueType.string, "rgb(0, 255, 0)", statuses_grp.id),
                ("Busy", "The status for when busy", "busy_status", SettingValueType.string, "rgb(255, 0, 0)", statuses_grp.id),
                ("Away", "The status for when away", "away_status", SettingValueType.string, "rgb(255, 255, 0)", statuses_grp.id),
                
                # Interval options
                ("default flash intervals", "The default interval speed for flashing light", "default_flash_intervals", SettingValueType.float, "0.5", intervals_grp.id),
                ("default wave intervals", "The default interval speed for wave light", "default_wave_intervals", SettingValueType.float, "0.3", intervals_grp.id),
                ("default scatter intervals", "The default interval speed for scatter light", "default_scatter_intervals", SettingValueType.float, "0.3", intervals_grp.id),
            ]

            for name, desc, key, v_type, val, group_id in default_settings:
                setting = SettingsModel(
                    name=name,
                    description=desc,
                    setting_key=key,
                    value_type=v_type,
                    value=val,
                    settings_group_id=group_id
                )
                session.add(setting)

        return True