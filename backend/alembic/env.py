# ─── Alembic environment ─────────────────────────────────────────────────────
# Migrations run on the sync URL (psycopg2 for Postgres, built-in sqlite3 for
# dev/tests) regardless of the app's async engine. The URL is always taken from
# app settings so there is exactly one source of truth.
from __future__ import annotations

import logging
from logging.config import fileConfig

from alembic import context
from sqlalchemy import engine_from_config, pool

from app.core.config import get_settings
from app.db.base import Base, JsonB

# Importing the models package registers every table on Base.metadata.
import app.db.models  # noqa: F401

config = context.config


def render_item(type_: str, obj, autogen_context) -> str | bool:
    """Render JsonB as a clean importable expression instead of 'app.db.base.JsonB'."""
    if type_ == "type" and isinstance(obj, JsonB):
        autogen_context.imports.add("from app.db.base import JsonB")
        return "JsonB()"
    return False

if config.config_file_name is not None:
    try:
        fileConfig(config.config_file_name, disable_existing_loggers=False)
    except Exception:  # noqa: BLE001 — logging config is non-fatal for migrations
        logging.getLogger("alembic").warning("Could not load alembic logging config", exc_info=True)

# Single source of truth for the target URL.
url = get_settings().database_engine_url
# Guard against ConfigParser interpolation of '%' in passwords.
config.set_main_option("sqlalchemy.url", url.replace("%", "%%"))

target_metadata = Base.metadata


def run_migrations_offline() -> None:
    """Emit SQL to stdout without a live DB connection (alembic upgrade --sql)."""
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        compare_type=True,
        render_item=render_item,
    )
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Run migrations against a live connection."""
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )
    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            compare_type=True,
            render_item=render_item,
        )
        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
