from unittest.mock import AsyncMock

import pytest
from fastapi.testclient import TestClient

from app import crud
from app.api import deps
from app.core.config import settings
from app.main import app
from app.models.chat import RiskFlag
from app.models.user import User
from app.services.ai_service import ai_service
from app.services.distress import detect_distress, distress_message


@pytest.mark.parametrize(
    "message",
    [
        "J'ai envie de mourir",
        "I want to die",
        "I WANT TO DIE",
        "Je veux me suicider",
        "J'ai plus envie de vivre",
        "Bghit nmout",
        "Me faire du mal",
        "Je veux en finir",
        "Je veux me faire du mäl",
    ],
)
def test_detect_distress_phrases(message: str) -> None:
    assert detect_distress(message) is True


def test_detect_distress_ignores_idiom() -> None:
    assert detect_distress("J'ai envie de mourir de rire") is False


def test_detect_distress_ignores_finishing_report() -> None:
    assert detect_distress("je dois en finir avec mon rapport") is False


def test_detect_distress_detects_finishing_with_life() -> None:
    assert detect_distress("je veux en finir avec la vie") is True


def test_detect_distress_uses_sentiment_threshold() -> None:
    assert detect_distress("Je suis fatigué", sentiment_score=-0.8) is True
    assert detect_distress("Je suis fatigué", sentiment_score=-0.79) is False


def test_detect_distress_without_sentiment() -> None:
    assert detect_distress("Je me sens un peu stressé", sentiment_score=None) is False


def test_detect_distress_empty_message() -> None:
    assert detect_distress("") is False


@pytest.mark.parametrize(
    ("lang", "resource_intro"),
    [
        ("fr", "Tu peux aussi contacter "),
        ("en", "For support, here are the contact details for Ynov Campus Maroc: "),
        ("ar", "للتواصل مع الدعم في Ynov Campus Maroc، إليك معلومات الاتصال: "),
    ],
)
def test_distress_message_contains_configured_resource(
    lang: str, resource_intro: str
) -> None:
    response = distress_message(lang)
    assert resource_intro + settings.SUPPORT_RESOURCE_TEXT in response
    assert settings.SUPPORT_RESOURCE_TEXT in response
    assert "15" in response
    assert "19" in response


def test_chat_distress_skips_model_and_sets_risk_flag(
    client: TestClient,
    db,
    monkeypatch: pytest.MonkeyPatch,
    caplog: pytest.LogCaptureFixture,
) -> None:
    user = User(id=1, email="test@example.com", is_active=True, full_name="Test")
    monkeypatch.setitem(app.dependency_overrides, deps.get_current_user, lambda: user)
    model_response = AsyncMock()
    monkeypatch.setattr(ai_service, "chat_response", model_response)

    response = client.post(
        f"{settings.API_V1_STR}/chat/ask",
        json={"role": "user", "content": "Je veux mourir"},
    )

    assert response.status_code == 200
    body = response.json()
    assert body["distress"] is True
    assert body["content"] == distress_message()
    assert body["session_id"] is not None
    model_response.assert_not_awaited()
    messages = crud.chat_message.get_by_session(db=db, session_id=body["session_id"])
    assert any(
        saved.role == "assistant" and saved.content == distress_message()
        for saved in messages
    )
    assert "Distress detected for user_id=1 at " in caplog.text
    assert "Je veux mourir" not in caplog.text

    session = crud.chat_session.get(db=db, id=body["session_id"])
    assert session is not None
    assert session.risk_flag == RiskFlag.CONCERNING
