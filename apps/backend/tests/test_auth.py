from fastapi.testclient import TestClient

from app.models.user import User


def test_login_success(client: TestClient, regular_user: User) -> None:
    resp = client.post(
        "/api/auth/login",
        json={"email": regular_user.email, "password": "password123"},
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["token_type"] == "bearer"
    assert isinstance(body["access_token"], str) and len(body["access_token"]) > 20


def test_login_failure_wrong_password(client: TestClient, regular_user: User) -> None:
    resp = client.post(
        "/api/auth/login",
        json={"email": regular_user.email, "password": "wrong-password"},
    )
    assert resp.status_code == 401
    assert resp.json()["detail"] == "invalid email or password"


def test_login_failure_unknown_email(client: TestClient) -> None:
    resp = client.post(
        "/api/auth/login",
        json={"email": "nobody@nowhere.example.com", "password": "whatever"},
    )
    assert resp.status_code == 401
