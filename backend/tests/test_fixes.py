
import io
import pandas as pd

from app.models import User
from app.auth import get_password_hash


def _make_admin(client, db, username="admin"):
    db.add(User(username=username, hashed_password=get_password_hash("password"), role="admin"))
    db.commit()
    res = client.post("/auth/token", data={"username": username, "password": "password"})
    return {"Authorization": f"Bearer {res.json()['access_token']}"}


def test_health_check(client):
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["database"] == "healthy"


def test_upload_duplicates_skipped(client, db):
    """Dedup rule: same Commuter Name + Date + Amount = duplicate."""
    admin_headers = _make_admin(client, db)

    df = pd.DataFrame([
        {"Commuter Name": "John", "Date": "2024-01-01", "Fleet": "1001", "Amount": 5000},
        {"Commuter Name": "John", "Date": "2024-01-01", "Fleet": "1001", "Amount": 5000},  # exact dup
        {"Commuter Name": "John", "Date": "2024-01-01", "Fleet": "1001", "Amount": 7500},  # diff amount → not dup
        {"Commuter Name": "Jane", "Date": "2024-01-01", "Fleet": "1001", "Amount": 5000},  # diff name → not dup
        {"Commuter Name": "John", "Date": "2024-01-02", "Fleet": "1002", "Amount": 5000},  # diff date → not dup
    ])
    buf = io.BytesIO()
    with pd.ExcelWriter(buf, engine='openpyxl') as writer:
        df.to_excel(writer, index=False)
    buf.seek(0)

    def upload():
        payload = buf.getvalue()
        return client.post(
            "/files/upload",
            files=[("files", ("test.xlsx", io.BytesIO(payload), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))],
            headers=admin_headers,
        )

    first = upload()
    assert first.status_code == 200
    stats = first.json()["stats"]
    assert stats["records_imported"] == 5          # all records imported (no within-file dedup)
    assert stats["duplicates_skipped"] == 0

    second = upload()                              # re-uploading same file imports nothing new
    assert second.status_code == 200
    stats = second.json()["stats"]
    assert stats["records_imported"] == 0
    assert stats["duplicates_skipped"] == 5        # all 5 already in DB

    summary = client.get("/analytics/summary", headers=admin_headers).json()
    assert len(summary["records"]) == 5            # DB has all 5 records


def test_password_reset_request_does_not_leak_token(client, db):
    db.add(User(username="resetme", email="resetme@example.com", hashed_password=get_password_hash("oldpass")))
    db.commit()

    response = client.post("/auth/password-reset-request", json={"email": "resetme@example.com"})
    assert response.status_code == 200
    assert "token" not in response.json()

    unknown = client.post("/auth/password-reset-request", json={"email": "nobody@example.com"})
    assert unknown.status_code == 200             # no account enumeration
    assert "token" not in unknown.json()


def test_admin_can_unlock_locked_user(client, db):
    admin_headers = _make_admin(client, db)

    user = User(username="lockme", hashed_password=get_password_hash("password"), role="user")
    db.add(user)
    db.commit()

    for _ in range(5):                             # trigger lockout
        client.post("/auth/token", data={"username": "lockme", "password": "wrong"})

    locked_res = client.get("/auth/users", headers=admin_headers)
    locked_user = next(u for u in locked_res.json() if u["username"] == "lockme")
    assert locked_user["is_locked"] is True

    unlock = client.post(f"/auth/users/{locked_user['id']}/unlock", headers=admin_headers)
    assert unlock.status_code == 200
    assert unlock.json()["is_locked"] is False

    login_res = client.post("/auth/token", data={"username": "lockme", "password": "password"})
    assert login_res.status_code == 200


def test_admin_cannot_delete_self(client, db):
    admin_headers = _make_admin(client, db)
    users = client.get("/auth/users", headers=admin_headers).json()
    admin_id = next(u for u in users if u["role"] == "admin")["id"]

    response = client.delete(f"/auth/users/{admin_id}", headers=admin_headers)
    assert response.status_code == 400


def test_email_report_validates_recipient(client, db):
    admin_headers = _make_admin(client, db)
    # No SMTP configured and no user email — must fail validation before attempting send
    response = client.post("/analytics/email-report?email=not-an-email", headers=admin_headers)
    assert response.status_code == 400
