"""
System settings routes
"""
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.auth import get_current_user
from app.database import get_db
from app.dependencies import admin_required
from app.models import SystemSetting, User
from app.schemas import SystemSettingBase, SystemSettingOut

router = APIRouter(prefix="/settings", tags=["Settings"])


@router.get("/", response_model=List[SystemSettingOut])
def get_settings(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    """Get all system settings (Requires Auth)."""
    return db.query(SystemSetting).all()


@router.put("/{key}", response_model=SystemSettingOut)
def update_setting(
    key: str,
    setting: SystemSettingBase,
    db: Session = Depends(get_db),
    _: User = Depends(admin_required),
):
    """Update a system setting (Admin only)."""
    db_setting = db.query(SystemSetting).filter(SystemSetting.key == key).first()
    if not db_setting:
        db_setting = SystemSetting(key=key, value=setting.value, description=setting.description)
        db.add(db_setting)
    else:
        db_setting.value = setting.value
        if setting.description:
            db_setting.description = setting.description

    db.commit()
    db.refresh(db_setting)
    return db_setting


@router.delete("/{key}", status_code=status.HTTP_200_OK)
def delete_setting(
    key: str,
    db: Session = Depends(get_db),
    _: User = Depends(admin_required),
):
    """Delete a system setting (Admin only)."""
    db_setting = db.query(SystemSetting).filter(SystemSetting.key == key).first()
    if not db_setting:
        raise HTTPException(status_code=404, detail="Setting not found")

    db.delete(db_setting)
    db.commit()
    return {"message": "Setting deleted successfully"}
