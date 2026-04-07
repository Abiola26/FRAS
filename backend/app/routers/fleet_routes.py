"""
Fleet record management routes
"""
from datetime import date
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app import crud
from app.auth import get_current_user
from app.database import get_db
from app.dependencies import admin_required
from app.models import FleetRecord, User
from app.schemas import FleetRecordBase, FleetRecordOut

router = APIRouter(prefix="/fleet", tags=["Fleet Records"])


@router.post("/", response_model=FleetRecordOut, status_code=status.HTTP_201_CREATED)
def create_record(
    data: FleetRecordBase,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Create a new fleet record.
    Requires authentication.
    """
    record = crud.create_fleet_record(db, data)
    crud.create_audit_log(
        db,
        current_user.id,
        current_user.username,
        "CREATE_RECORD",
        f"Fleet: {data.fleet}, Date: {data.date}",
    )
    return record


@router.get("/", response_model=List[FleetRecordOut])
def get_records(
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get all fleet records with pagination.
    Requires authentication.
    """
    return crud.get_fleet_records(db, skip, limit)


@router.get("/{record_id}", response_model=FleetRecordOut)
def get_record(
    record_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get a single fleet record by ID."""
    record = db.query(FleetRecord).filter(FleetRecord.id == record_id).first()
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Record with ID {record_id} not found",
        )
    return record


@router.put("/{record_id}", response_model=FleetRecordOut)
def update_record(
    record_id: int,
    data: FleetRecordBase,
    db: Session = Depends(get_db),
    current_user: User = Depends(admin_required),
):
    """
    Update a fleet record fully.
    Requires admin role.
    """
    record = db.query(FleetRecord).filter(FleetRecord.id == record_id).first()
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Record with ID {record_id} not found",
        )

    record.date = data.date
    record.fleet = data.fleet
    record.amount = data.amount
    db.commit()
    db.refresh(record)

    crud.create_audit_log(
        db,
        current_user.id,
        current_user.username,
        "UPDATE_RECORD",
        f"ID: {record_id}",
    )
    return record


@router.delete("/batch", status_code=status.HTTP_200_OK)
def delete_records_batch(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    fleet: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(admin_required),
):
    """
    Delete multiple records based on filters.
    """
    count = crud.delete_records_batch(db, start_date, end_date, fleet)

    crud.create_audit_log(
        db,
        current_user.id,
        current_user.username,
        "DELETE_BATCH",
        f"Count: {count}, Filters: start={start_date}, end={end_date}, fleet={fleet}",
    )

    return {"message": f"Successfully deleted {count} records", "count": count}


@router.delete("/{record_id}")
def delete_record(
    record_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(admin_required),
):
    """
    Delete a fleet record by ID.
    Requires admin role.
    """
    deleted = crud.delete_record(db, record_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Record with ID {record_id} not found",
        )

    crud.create_audit_log(
        db,
        current_user.id,
        current_user.username,
        "DELETE_RECORD",
        f"ID: {record_id}",
    )

    return {"message": "Record deleted successfully", "id": record_id}
