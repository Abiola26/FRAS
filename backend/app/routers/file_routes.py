"""
File upload and processing routes
"""
import logging
from io import BytesIO

import pandas as pd
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app import crud
from app.auth import get_current_user
from app.database import get_db
from app.dependencies import admin_required
from app.models import FleetRecord, User

router = APIRouter(prefix="/files", tags=["File Upload"])
logger = logging.getLogger(__name__)

REQUIRED_COLUMNS = {"Date", "Fleet", "Amount"}
ALLOWED_EXTENSIONS = {".csv", ".xlsx"}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB


def _parse_files(files: list[UploadFile], db: Session):
    """Parse uploaded files and return parsed records + duplicates found in DB."""
    parsed_rows = []
    errors = []

    for file in files:
        file_ext = f".{file.filename.rsplit('.', 1)[-1].lower()}" if "." in file.filename else ""
        if file_ext not in ALLOWED_EXTENSIONS:
            errors.append(f"{file.filename}: Invalid type")
            continue

        content = file.file.read()
        if len(content) > MAX_FILE_SIZE:
            errors.append(f"{file.filename}: Size exceeds limit")
            continue

        try:
            if file_ext == ".csv":
                df = pd.read_csv(BytesIO(content))
            else:
                df = pd.read_excel(BytesIO(content))
        except Exception as e:
            logger.error(f"Error reading file {file.filename}: {e}")
            errors.append(f"{file.filename}: Read error - {e}")
            continue

        df_cols = {c.lower() for c in df.columns}
        missing = {c.lower() for c in REQUIRED_COLUMNS} - df_cols
        if missing:
            errors.append(f"{file.filename}: Missing columns {missing}")
            continue

        col_map = {}
        for c in df.columns:
            cl = c.lower()
            if cl in {"date", "fleet", "amount", "commuter name"}:
                col_map[c] = {
                    "date": "Date",
                    "fleet": "Fleet",
                    "amount": "Amount",
                    "commuter name": "Commuter Name",
                }[cl]
        df = df.rename(columns=col_map)

        df["Date"] = pd.to_datetime(df["Date"], format="mixed", dayfirst=False, errors="coerce").dt.date
        df["Amount"] = pd.to_numeric(df["Amount"], errors="coerce").fillna(0)
        df["Fleet"] = df["Fleet"].astype(str).str.strip().str.upper().replace("2010M", "2010")

        has_cn = "Commuter Name" in df.columns
        if has_cn:
            df["Commuter Name"] = df["Commuter Name"].astype(str).str.strip()
            df.loc[df["Commuter Name"].isin(["", "nan", "None", "NaN"]), "Commuter Name"] = None
            df = df.rename(columns={"Commuter Name": "CommuterName"})
        else:
            df["CommuterName"] = None

        df = df.dropna(subset=["Date"])

        for row in df.itertuples(index=False):
            parsed_rows.append({
                "commuter_name": row.CommuterName if has_cn else None,
                "date": row.Date,
                "fleet": row.Fleet,
                "amount": row.Amount,
                "source_file": file.filename,
            })

    return parsed_rows, errors


@router.post("/check-duplicates")
async def check_duplicates(
    files: list[UploadFile] = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(admin_required),
):
    """Parse files and return duplicates against DB without saving."""
    parsed_rows, errors = _parse_files(files, db)

    if errors and not parsed_rows:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Import failed: {errors}",
        )

    candidate_dates = {r["date"] for r in parsed_rows}
    existing_records = (
        db.query(FleetRecord.commuter_name, FleetRecord.date, FleetRecord.amount)
        .filter(FleetRecord.date.in_(candidate_dates))
        .all()
    )
    existing_keys = {(r.commuter_name, r.date, r.amount) for r in existing_records}

    duplicates = []
    new_records = []

    for row in parsed_rows:
        key = (row["commuter_name"], row["date"], row["amount"])
        if key in existing_keys:
            duplicates.append(row)
        else:
            new_records.append(row)

    return {
        "total_records": len(parsed_rows),
        "duplicates_count": len(duplicates),
        "new_count": len(new_records),
        "duplicates": duplicates,
        "errors": errors,
    }


@router.post("/upload")
async def upload_files(
    files: list[UploadFile] = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(admin_required),
):
    """
    Upload CSV or Excel files and process them.

    Duplicate check: Commuter Name + Date + Amount.
    All three must match exactly for a record to be skipped as duplicate.
    """
    if not files:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No files provided",
        )

    import_stats = {
        "files_processed": 0,
        "records_imported": 0,
        "duplicates_skipped": 0,
        "errors": [],
    }

    new_records: list[FleetRecord] = []

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
        col_map = {}
        for c in df.columns:
            cl = c.lower()
            if cl in {"date", "fleet", "amount", "commuter name"}:
                target = {
                    "date": "Date",
                    "fleet": "Fleet",
                    "amount": "Amount",
                    "commuter name": "Commuter Name",
                }[cl]
                col_map[c] = target
        df = df.rename(columns=col_map)

        # Clean and normalize data
        df["Date"] = pd.to_datetime(df["Date"], format="mixed", dayfirst=False, errors="coerce").dt.date
        df["Amount"] = pd.to_numeric(df["Amount"], errors="coerce").fillna(0)
        df["Fleet"] = df["Fleet"].astype(str).str.strip().str.upper().replace("2010M", "2010")

        # Normalize commuter name if present
        has_commuter_name = "Commuter Name" in df.columns
        if has_commuter_name:
            df["Commuter Name"] = df["Commuter Name"].astype(str).str.strip()
            df.loc[df["Commuter Name"].isin(["", "nan", "None", "NaN"]), "Commuter Name"] = None
        else:
            df["Commuter Name"] = None

        df = df.dropna(subset=["Date"])

        # Rename commuter_name to a valid Python identifier for itertuples
        if has_commuter_name:
            df = df.rename(columns={"Commuter Name": "CommuterName"})

        new_records.extend(
            FleetRecord(
                commuter_name=getattr(row, "CommuterName", None) if has_commuter_name else None,
                date=row.Date,
                fleet=row.Fleet,
                amount=row.Amount,
            )
            for row in df.itertuples(index=False)
        )
        import_stats["files_processed"] += 1

    # Skip rows that already exist in the database: (Commuter Name, Date, Amount)
    if new_records:
        candidate_dates = {r.date for r in new_records}
        existing_records = (
            db.query(FleetRecord.commuter_name, FleetRecord.date, FleetRecord.amount)
            .filter(FleetRecord.date.in_(candidate_dates))
            .all()
        )
        existing_keys = {(r.commuter_name, r.date, r.amount) for r in existing_records}

        kept: list[FleetRecord] = []
        for record in new_records:
            key = (record.commuter_name, record.date, record.amount)
            if key in existing_keys:
                import_stats["duplicates_skipped"] += 1
            else:
                kept.append(record)
        new_records = kept

    import_stats["records_imported"] = len(new_records)

    try:
        if new_records:
            from sqlalchemy import insert as sa_insert
            rows = [
                {
                    "date": r.date,
                    "fleet": r.fleet,
                    "amount": r.amount,
                    "commuter_name": r.commuter_name,
                }
                for r in new_records
            ]
            batch_size = 500
            for i in range(0, len(rows), batch_size):
                batch = rows[i:i + batch_size]
                db.execute(sa_insert(FleetRecord), batch)
                db.commit()
            logger.info(f"Successfully imported {import_stats['records_imported']} fleet records")
    except Exception as e:
        db.rollback()
        logger.error(f"Database error: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error saving records to database",
        )

    if import_stats["files_processed"] == 0 and import_stats["errors"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Import failed: {import_stats['errors']}",
        )

    if import_stats["records_imported"] > 0 or import_stats["duplicates_skipped"] > 0:
        admins = db.query(User).filter(User.role == "admin").all()
        summary_parts = [f"{import_stats['records_imported']} new records imported"]
        if import_stats["duplicates_skipped"]:
            summary_parts.append(f"{import_stats['duplicates_skipped']} duplicates skipped")
        for admin in admins:
            crud.create_notification(
                db,
                title="Data Import Successful",
                message=f"{'; '.join(summary_parts)} from {import_stats['files_processed']} file(s).",
                type="info",
                user_id=admin.id,
            )

    crud.create_audit_log(
        db,
        current_user.id,
        current_user.username,
        "UPLOAD_FILES",
        f"Files: {import_stats['files_processed']}, Imported: {import_stats['records_imported']}, "
        f"Duplicates skipped: {import_stats['duplicates_skipped']}",
    )

    return {
        "message": "Upload processing complete",
        "stats": import_stats,
    }
