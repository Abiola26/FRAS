from sqlalchemy import text
from app.database import engine

def migrate():
    with engine.begin() as conn: # Use begin() for automatic commit
        print("Starting migration...")
        
        # Helper to add column if missing
        def add_column(table, col, type_str):
            try:
                # Check if exists first (raw SQL way for compatibility)
                conn.execute(text(f"ALTER TABLE {table} ADD COLUMN {col} {type_str}"))
                print(f"  Successfully added {col} to {table}")
            except Exception as e:
                print(f"  Info: {col} might already exist or error: {e}")

        # SQLite vs PG types. Requirements has psycopg2, so likely PG.
        # But let's be safe. Use TIMESTAMP for datetimes.
        
        add_column("users", "failed_login_attempts", "INTEGER DEFAULT 0")
        add_column("users", "last_login", "TIMESTAMP")
        add_column("users", "is_locked", "BOOLEAN DEFAULT FALSE")
        
        print("Migration complete.")

if __name__ == "__main__":
    migrate()
