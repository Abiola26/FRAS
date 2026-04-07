"""
File upload and processing routes
"""
import logging
from io import BytesIO

import pandas as pd
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app import crud
from app.database import get_db
from app.dependencies import admin_required
from app.models import FleetRecord, User

router = APIRouter(prefix="/files", tags=["File Upload"])
logger = logging.getLogger(__name__)

REQUIRED_COLUMNS = {"Date", "Fleet", "Amount"}
ALLOWED_EXTENSIONS = {".csv", ".xlsx"}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB


@router.post("/upload")
async def upload_files(
    files: list[UploadFile] = File(...),
    db: Session = Depends(get_db),
    _: User = Depends(admin_required),
):
    """
    Upload CSV or Excel files and process them.

    - Accepts multiple files
    - Validates columns
    - Imports data to database
    - Returns import summary
    """
    if not files:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No files provided",
        )

    import_stats = {
        "files_processed": 0,
        "records_imported": 0,
        "errors": [],
    }

    for file in files:
        file_ext = f".{file.filename.rsplit('.', 1)[-1].lower()}" if "." in file.filename else ""
        if file_ext not in ALLOWED_EXTENSIONS:
            import_stats["errors"].append(f"{file.filename}: Invalid type")
            continue

        content = await file.read()

        if len(content) > MAX_FILE_SIZE:
            import_stats["errors"].append(f"{file.filename}: Size exceeds limit")
            continue

        try:
            if file_ext == ".csv":
                df = pd.read_csv(BytesIO(content))
            else:
                df = pd.read_excel(BytesIO(content))
        except Exception as e:
            logger.error(f"Error reading file {file.filename}: {e}")
            import_stats["errors"].append(f"{file.filename}: Read error - {e}")
            continue

        # Case-insensitive column validation
        df_cols = {c.lower() for c in df.columns}
        missing = {c.lower() for c in REQUIRED_COLUMNS} - df_cols
        if missing:
            import_stats["errors"].append(f"{file.filename}: Missing columns {missing}")
            continue

        # Normalize column names to standard casing
        col_map = {
            c: {"date": "Date", "fleet": "Fleet", "amount": "Amount"}[c.lower()]
            for c in df.columns
            if c.lower() in {"date", "fleet", "amount"}
        }
        df = df.rename(columns=col_map)

        # Clean and normalize data
        df["Date"] = pd.to_datetime(df["Date"], errors="coerce").dt.date
        df["Amount"] = pd.to_numeric(df["Amount"], errors="coerce").fillna(0)
        df["Fleet"] = df["Fleet"].astype(str).str.strip().str.upper().replace("2010M", "2010")
        df = df.dropna(subset=["Date"])

        file_records = 0
        for _, row in df.iterrows():
            try:
                db.add(FleetRecord(date=row["Date"], fleet=row["Fleet"], amount=row["Amount"]))
                file_records += 1
            except Exception as e:
                logger.warning(f"Skipping row in {file.filename}: {e}")

        import_stats["files_processed"] += 1
        import_stats["records_imported"] += file_records

    try:
        db.commit()
        logger.info(f"Successfully imported {import_stats['records_imported']} fleet records")
    except Exception as e:
        db.rollback()
        logger.error(f"Database error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error saving records to database",
        )

    if import_stats["files_processed"] == 0 and import_stats["errors"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Import failed: {import_stats['errors']}",
        )

    if import_stats["records_imported"] > 0:
        admins = db.query(User).filter(User.role == "admin").all()
        for admin in admins:
            crud.create_notification(
                db,
                title="Data Import Successful",
                message=f"{import_stats['records_imported']} new records imported from {import_stats['files_processed']} file(s).",
                type="info",
                user_id=admin.id,
            )

    return {
        "message": "Upload processing complete",
        "stats": import_stats,
    }
