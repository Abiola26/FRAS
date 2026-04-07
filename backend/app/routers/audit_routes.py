"""
Audit Log routes
"""
from typing import Optional

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import admin_required
from app.models import AuditLog, User
from app.schemas import AuditLogOut

router = APIRouter(prefix="/audit", tags=["Audit Logs"])


@router.get("/", response_model=list[AuditLogOut])
def get_audit_logs(
    skip: int = 0,
    limit: int = 50,
    action: Optional[str] = None,
    username: Optional[str] = None,
    db: Session = Depends(get_db),
    _: User = Depends(admin_required),
):
    """
    Get audit logs (Admin only) with optional filtering.
    """
    query = db.query(AuditLog)

    if action:
        query = query.filter(AuditLog.action == action)
    if username:
        query = query.filter(AuditLog.username.ilike(f"%{username}%"))

    # Descending order to see latest first
    logs = query.order_by(AuditLog.timestamp.desc()).offset(skip).limit(limit).all()
    return logs
