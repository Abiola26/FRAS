from sqlalchemy import inspect
from app.database import engine
from app.models import User

inspector = inspect(engine)
columns = [c['name'] for c in inspector.get_columns('users')]
print(f"Columns in 'users' table: {columns}")

required = ['failed_login_attempts', 'last_login', 'is_locked']
missing = [r for r in required if r not in columns]
if missing:
    print(f"MISSING COLUMNS: {missing}")
else:
    print("All columns present.")
