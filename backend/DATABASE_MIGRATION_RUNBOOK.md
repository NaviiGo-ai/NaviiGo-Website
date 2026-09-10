# NaviiGo Database Migration Runbook

This guide covers how to manage database migrations using Alembic in the NaviiGo backend. It uses an async engine (SQLAlchemy + asyncpg).

## Prerequisites

- PostgreSQL server running and accessible
- Valid `DATABASE_URL` configured in your `.env` file or environment variables
- `alembic` installed (included in `requirements.txt`)

## Running Migrations

Never modify the production tables directly. All schema changes must be applied via Alembic migrations.

### In Local / Development Environment

To upgrade the database to the latest schema:
```bash
cd backend
source venv/Scripts/activate  # (Windows) or 'source venv/bin/activate' (Linux/Mac)
alembic upgrade head
```

If you need to define where the database is located via CLI override (ignoring the .env file):
```bash
DATABASE_URL=postgresql+asyncpg://user:pass@localhost:5432/naviigo_dev alembic upgrade head
```

### In Production

Production environments should automate migrations via a CI/CD pipeline or an entrypoint script before the web server begins accepting traffic.

Example Kubernetes Init Container script snippet:
```bash
#!/bin/sh
set -e
echo "Running database migrations..."
alembic upgrade head
echo "Database migrations complete."
```

## Creating New Migrations

When you modify SQLAlchemy models in `app/db/models/`, you need to generate a new migration script.

1. Ensure the models you added or modified are imported in `app/db/models/__init__.py`. Alembic relies on this to inspect the `Base.metadata`.
2. Generate an automatic migration:
   ```bash
   alembic revision --autogenerate -m "Add short description of the change"
   ```
3. A new file will be created in `backend/alembic/versions/`. **You must review this file.** Alembic is not perfect and may miss nuanced operations (like enum changes, drops or renaming columns).
4. Do not commit a migration script that contains `pass` in the `upgrade()` or `downgrade()` functions when changes are expected.
5. After review, test the migration locally:
   ```bash
   alembic upgrade head
   ```

## Downgrading (Rollbacks)

If a migration introduced an issue, you can roll back to the previous version:

```bash
# Downgrade by 1 revision
alembic downgrade -1

# Downgrade to a specific revision ID (e.g., 8e30b6e9275b)
alembic downgrade 8e30b6e9275b
```

⚠️ **Warning:** Avoid downgrading in production unless absolutely necessary and coordinated. Rolling back migrations can lead to data loss (e.g., if a column is dropped). It is often safer to write a *new* migration that reverses the effects (a roll-forward approach).

## Troubleshooting

### "Target database is not up to date" error during `--autogenerate`
It means your local database schema is behind the latest migration script. Apply the pending migrations first:
```bash
alembic upgrade head
```

### Multiple Heads Error
If two developers create migrations at the same time, their revisions will branch off the same base, causing a "multiple heads" issue.

Solution: Merge the branches.
```bash
alembic merge head1 head2 -m "Merge concurrent migrations"
```
Or, simply rebase your dev branch onto `main` and delete / recreate your migration if it hasn't been merged to main yet.

### `alembic` commands hang indefinitely
This usually occurs if the `env.py` uses synchronous wait operations with the async SQLAlchemy engine inappropriately, or if another connection holds an exclusive lock on standard tables (like `alembic_version`). Wait for the lock to be released or kill the locking query in Postgres.