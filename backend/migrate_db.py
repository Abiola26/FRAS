from sqlalchemy import create_engine, text
from app.database import engine

def migrate():
    with engine.connect() as conn:
        print("Checking for missing columns...")
        
        # Add failed_login_attempts
        try:
            conn.execute(text("ALTER TABLE users ADD COLUMN failed_login_attempts INTEGER DEFAULT 0"))
            print("  Added failed_login_attempts")
        except Exception as e:
            print(f"  failed_login_attempts might already exist: {e}")
            
        # Add last_login
        try:
            conn.execute(text("ALTER TABLE users ADD COLUMN last_login DATETIME"))
            print("  Added last_login")
        except Exception as e:
            print(f"  last_login might already exist: {e}")
            
        # Add is_locked
        try:
            conn.execute(text("ALTER TABLE users ADD COLUMN is_locked BOOLEAN DEFAULT FALSE"))
            print("  Added is_locked")
        except Exception as e:
            print(f"  is_locked might already exist: {e}")
            
        conn.commit()
        print("Migration complete.")

if __name__ == "__main__":
    migrate()
