"""
Fleet Reporting Backend - Main Application
"""
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from jose import jwt

from app.config import get_settings
from app.database import Base, SessionLocal, engine
from app.models import SystemSetting, User
from app.routers import (
    analytics_routes,
    audit_routes,
    auth_routes,
    file_routes,
    fleet_routes,
    notification_routes,
    settings_routes,
)
from app.utils.limiter import init_limiter
from app.utils.logging_config import setup_logging

settings = get_settings()

setup_logging(debug=settings.debug)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events."""
    logger.info("Starting Fleet Reporting Backend...")
    Base.metadata.create_all(bind=engine)
    logger.info("Database tables created/verified")
    yield
    logger.info("Shutting down Fleet Reporting Backend...")


app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="Fleet Reporting and Analytics System API",
    lifespan=lifespan,
)

init_limiter(app)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def check_maintenance_mode(request, call_next):
    if request.url.path in ["/", "/health", "/auth/token", "/auth/signup", "/docs", "/openapi.json"]:
        return await call_next(request)

    db = SessionLocal()
    try:
        maintenance = db.query(SystemSetting).filter(SystemSetting.key == "MAINTENANCE_MODE").first()
        if maintenance and maintenance.value.lower() == "true":
            auth_header = request.headers.get("Authorization")
            if auth_header and auth_header.startswith("Bearer "):
                token = auth_header.split(" ")[1]
                try:
                    payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
                    username = payload.get("sub")
                    if username:
                        user = db.query(User).filter(User.username == username).first()
                        if user and user.role == "admin":
                            return await call_next(request)
                except Exception:
                    pass

            return JSONResponse(
                status_code=503,
                content={"detail": "System is currently undergoing maintenance. Please try again later."},
            )
    finally:
        db.close()

    return await call_next(request)


app.include_router(auth_routes.router)
app.include_router(fleet_routes.router)
app.include_router(file_routes.router)
app.include_router(analytics_routes.router)
app.include_router(audit_routes.router)
app.include_router(settings_routes.router)
app.include_router(notification_routes.router)


@app.get("/", tags=["Root"])
def root():
    """Root endpoint."""
    return {
        "message": "Fleet Reporting Backend is running",
        "version": settings.app_version,
        "status": "healthy",
    }


@app.get("/health", tags=["Health"])
def health_check():
    """Health check endpoint with proper DB ping."""
    db_status = "healthy"
    try:
        db = SessionLocal()
        db.execute("SELECT 1")
    except Exception as e:
        logger.error(f"Health check DB error: {e}")
        db_status = "unhealthy"
    finally:
        db.close()

    return {
        "status": "healthy" if db_status == "healthy" else "unhealthy",
        "database": db_status,
        "service": settings.app_name,
        "version": settings.app_version,
    }
