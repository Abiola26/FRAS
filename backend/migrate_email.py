from sqlalchemy import text
from app.database import engine

def migrate():
    with engine.begin() as conn:
        print("Adding email column to users table...")
        try:
            conn.execute(text("ALTER TABLE users ADD COLUMN email VARCHAR(255)"))
            print("  Successfully added email column.")
        except Exception as e:
            print(f"  Info: email column might already exist or error: {e}")
            
if __name__ == "__main__":
    migrate()
