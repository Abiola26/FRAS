"""
Analytics and Reporting Routes
"""
from datetime import date
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import StreamingResponse
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.auth import get_current_user
from app.database import get_db
from app.models import FleetRecord, User
from app.schemas import AnalyticsResponse, ChartDataPoint, ChartResponse, DashboardStats, FilterOptions
from app.utils import DataProcessor, ReportGenerator

router = APIRouter(prefix="/analytics", tags=["Analytics & Reporting"])


def get_filtered_query(
    db: Session,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    fleets: Optional[list[str]] = Query(None),
    limit: Optional[int] = None,
):
    """Apply date/fleet filters to fleet query and return ordered query."""
    query = db.query(FleetRecord)

    if start_date:
        query = query.filter(FleetRecord.date >= start_date)
    if end_date:
        query = query.filter(FleetRecord.date <= end_date)
    if fleets:
        query = query.filter(FleetRecord.fleet.in_(fleets))

    query = query.order_by(FleetRecord.date.desc())

    if limit:
        query = query.limit(limit)

    return query


@router.get("/summary", response_model=AnalyticsResponse)
def get_analytics_summary(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    fleets: Optional[list[str]] = Query(None),
    limit: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get comprehensive analytics summary including records (heavier payload)."""
    query = get_filtered_query(db, start_date, end_date, fleets, limit=limit)
    records = query.with_entities(FleetRecord.id, FleetRecord.date, FleetRecord.fleet, FleetRecord.amount).all()
    return DataProcessor.process_analytics(records)


@router.get("/dashboard-stats", response_model=DashboardStats)
def get_dashboard_stats(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    fleets: Optional[list[str]] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Optimized endpoint for Dashboard KPI cards.
    Uses direct SQL aggregation for maximum performance.
    """
    # Clear ordering before aggregation queries to avoid SQL errors
    base_query = get_filtered_query(db, start_date, end_date, fleets).order_by(None)

    # Total Revenue & Count
    stats = base_query.with_entities(
        func.sum(FleetRecord.amount).label("total_amount"),
        func.count(FleetRecord.id).label("total_count"),
    ).first()

    total_revenue = stats.total_amount or 0
    total_records = stats.total_count or 0
    average_trip_revenue = total_revenue / total_records if total_records > 0 else 0

    # Top Performing Fleet
    top_fleet_row = (
        base_query.with_entities(
            FleetRecord.fleet,
            func.sum(FleetRecord.amount).label("fleet_total"),
        )
        .group_by(FleetRecord.fleet)
        .order_by(func.sum(FleetRecord.amount).desc())
        .limit(1)
        .first()
    )
    top_performing_fleet = top_fleet_row.fleet if top_fleet_row else "N/A"

    # Predictive Revenue: weighted average of last 14 days (most recent = highest weight)
    all_dates = (
        db.query(FleetRecord.date, func.sum(FleetRecord.amount))
        .group_by(FleetRecord.date)
        .order_by(FleetRecord.date.desc())
        .limit(14)
        .all()
    )

    if all_dates:
        weighted_sum = sum(daily_total * (14 - i) for i, (_, daily_total) in enumerate(all_dates))
        total_weight = sum(14 - i for i in range(len(all_dates)))
        predicted_revenue = weighted_sum / total_weight if total_weight > 0 else 0
    else:
        predicted_revenue = 0

    return DashboardStats(
        total_revenue=total_revenue,
        total_records=total_records,
        top_performing_fleet=top_performing_fleet,
        average_trip_revenue=average_trip_revenue,
        predicted_revenue=predicted_revenue,
    )


@router.get("/charts", response_model=ChartResponse)
def get_analytics_charts(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    fleets: Optional[list[str]] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Optimized endpoint for analytics charts.
    Returns pre-aggregated data to avoid sending large payloads.
    """
    base_query = get_filtered_query(db, start_date, end_date, fleets).order_by(None)

    # Revenue Trend (daily)
    revenue_trend = [
        ChartDataPoint(label=str(r.date), value=r.total)
        for r in base_query.with_entities(
            FleetRecord.date,
            func.sum(FleetRecord.amount).label("total"),
        ).group_by(FleetRecord.date).order_by(FleetRecord.date).all()
    ]

    # Revenue by Fleet
    revenue_by_fleet = [
        ChartDataPoint(label=r.fleet, value=r.total)
        for r in base_query.with_entities(
            FleetRecord.fleet,
            func.sum(FleetRecord.amount).label("total"),
        ).group_by(FleetRecord.fleet).order_by(func.sum(FleetRecord.amount).desc()).all()
    ]

    top_fleets = revenue_by_fleet[:15]

    # Anomalies (requires full record set)
    records = base_query.with_entities(FleetRecord.id, FleetRecord.date, FleetRecord.fleet, FleetRecord.amount).all()
    analytics = DataProcessor.process_analytics(records)

    return ChartResponse(
        revenue_trend=revenue_trend,
        revenue_by_fleet=revenue_by_fleet,
        top_fleets=top_fleets,
        anomalies=analytics.anomalies,
    )


@router.get("/filters", response_model=FilterOptions)
def get_filter_options(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get available filter options (date range, fleet list)."""
    fleets = [r[0] for r in db.query(FleetRecord.fleet).distinct().all()]
    min_date = db.query(func.min(FleetRecord.date)).scalar()
    max_date = db.query(func.max(FleetRecord.date)).scalar()

    return FilterOptions(fleets=sorted(fleets), min_date=min_date, max_date=max_date)


@router.get("/download/excel")
def download_excel_report(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    fleets: Optional[list[str]] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Download analytics report as Excel."""
    query = get_filtered_query(db, start_date, end_date, fleets)
    records = query.with_entities(FleetRecord.id, FleetRecord.date, FleetRecord.fleet, FleetRecord.amount).all()
    analytics = DataProcessor.process_analytics(records)
    excel_file = ReportGenerator.generate_excel(analytics)

    filename = f"Fleet_Report_{date.today()}.xlsx"
    return StreamingResponse(
        excel_file,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )


@router.get("/download/pdf")
def download_pdf_report(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    fleets: Optional[list[str]] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Download analytics report as PDF."""
    query = get_filtered_query(db, start_date, end_date, fleets)
    records = query.with_entities(FleetRecord.id, FleetRecord.date, FleetRecord.fleet, FleetRecord.amount).all()
    analytics = DataProcessor.process_analytics(records)
    pdf_file = ReportGenerator.generate_pdf(analytics)

    filename = f"Fleet_Report_{date.today()}.pdf"
    return StreamingResponse(
        pdf_file,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )


@router.post("/email-report")
async def email_report(
    email: str = Query(None, description="Recipient email (defaults to current user's email)"),
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    fleets: Optional[list[str]] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Generate and email the analytics report (PDF & Excel)."""
    from fastapi_mail import ConnectionConfig, FastMail, MessageSchema, MessageType

    from app.config import get_settings

    settings = get_settings()

    query = get_filtered_query(db, start_date, end_date, fleets)
    records = query.with_entities(FleetRecord.id, FleetRecord.date, FleetRecord.fleet, FleetRecord.amount).all()
    analytics = DataProcessor.process_analytics(records)

    pdf_io = ReportGenerator.generate_pdf(analytics)
    xlsx_io = ReportGenerator.generate_excel(analytics)
    today = date.today()

    conf = ConnectionConfig(
        MAIL_USERNAME=settings.mail_username,
        MAIL_PASSWORD=settings.mail_password,
        MAIL_FROM=settings.mail_from,
        MAIL_PORT=settings.mail_port,
        MAIL_SERVER=settings.mail_server,
        MAIL_STARTTLS=settings.mail_starttls,
        MAIL_SSL_TLS=settings.mail_ssl_tls,
        USE_CREDENTIALS=True,
        VALIDATE_CERTS=True,
    )

    recipient = email or current_user.email
    if not recipient or "@" not in recipient:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A valid recipient email is required.",
        )

    message = MessageSchema(
        subject=f"Fleet Analytics Report - {today}",
        recipients=[recipient],
        item_objects=[
            (f"Report_{today}.pdf", pdf_io.getvalue(), "application/pdf"),
            (f"Data_{today}.xlsx", xlsx_io.getvalue(), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"),
        ],
        body=f"Please find attached the fleet analytics report for {today}.",
        subtype=MessageType.html,
    )

    fm = FastMail(conf)
    try:
        await fm.send_message(message)
        return {"message": f"Report sent to {recipient}"}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to send email: {e}",
        )
