from sqlalchemy import inspect
from app.database import engine

inspector = inspect(engine)
columns = [c['name'] for c in inspector.get_columns('users')]
for col in columns:
    print(f"COL: {col}")
