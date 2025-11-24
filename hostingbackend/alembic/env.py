import os
import sys
import re
from logging.config import fileConfig

from sqlalchemy import create_engine, pool
from sqlalchemy.engine import Connection
from alembic import context
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Add project root to sys.path
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
sys.path.insert(0, BASE_DIR)

# Alembic config
config = context.config

# Logging config
if config.config_file_name and os.path.exists(config.config_file_name):
    fileConfig(config.config_file_name)
    print("✅ Logging configured successfully")

# Import SQLAlchemy Base
from app.models.base import Base

# Alembic target metadata
target_metadata = Base.metadata


# ------------------------------------------------------------
# Convert async DB URL to sync (required for Alembic)
# ------------------------------------------------------------
raw_db_url = os.getenv("DATABASE_URL")

if not raw_db_url:
    raise RuntimeError("❌ DATABASE_URL not found in environment variables")

# Convert async ⇒ sync for PostgreSQL
if raw_db_url.startswith("postgresql+asyncpg://"):
    sync_url = raw_db_url.replace("postgresql+asyncpg://", "postgresql+psycopg2://")

elif raw_db_url.startswith("postgresql://"):
    sync_url = raw_db_url.replace("postgresql://", "postgresql+psycopg2://")

# SQLite (async → sync)
elif raw_db_url.startswith("sqlite+aiosqlite://"):
    sync_url = raw_db_url.replace("+aiosqlite", "")

else:
    sync_url = raw_db_url

# Strip sslmode (not supported by psycopg2 inside Alembic)
sync_url = re.sub(r"[?&]sslmode=[^&]*", "", sync_url)

# Escape % for ConfigParser
escaped_url = sync_url.replace("%", "%%")

# Inject URL into alembic.ini
config.set_main_option("sqlalchemy.url", escaped_url)

print(f"📊 Using database: {sync_url}")


# ------------------------------------------------------------
# Migration Modes
# ------------------------------------------------------------
def run_migrations_offline():
    """Run migrations in 'offline' mode."""
    context.configure(
        url=sync_url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        compare_type=True,
        compare_server_default=True,
    )

    with context.begin_transaction():
        context.run_migrations()


def do_run_migrations(connection: Connection):
    """Run actual migrations."""
    context.configure(
        connection=connection,
        target_metadata=target_metadata,
        compare_type=True,
        compare_server_default=True,
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online():
    """Run migrations in 'online' mode."""
    engine = create_engine(sync_url, poolclass=pool.NullPool)

    with engine.connect() as connection:
        do_run_migrations(connection)


# ------------------------------------------------------------
# Execute mode
# ------------------------------------------------------------
if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
