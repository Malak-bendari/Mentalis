"""Détection minimale des messages de détresse et réponse prédéfinie."""

import re
import unicodedata

from app.core.config import settings

SENTIMENT_THRESHOLD = settings.SENTIMENT_THRESHOLD

DISTRESS_PATTERNS = [
    "envie de mourir",
    "je veux mourir",
    "plus envie de vivre",
    "me faire du mal",
    "en finir avec la vie",
    "en finir avec tout",
    "veux en finir",
    "veux en finir avec moi",
    "me suicider",
    "je veux me suicider",
    "i want to die",
    "kill myself",
    "end it all",
    "self harm",
    "hurt myself",
    "bghit nmout",
    "ma bqitch bghit n3ich",
    "ma bqitch baghi n3ich",
    "ma b9itch bghit n3ich",
    "bghit n9tel rassi",
    "bghit n7yed rassi",
]

_COMPILED_PATTERNS = tuple(
    re.compile(r"\b" + re.escape(pattern).replace(r"\ ", r"\s+") + r"\b")
    for pattern in DISTRESS_PATTERNS
)
_IDIOM_PATTERN = re.compile(
    r"\b(?:j[' ]ai\s+)?envie\s+de\s+mourir\s+de\s+rire\b"
    r"|\bje\s+veux\s+mourir\s+de\s+rire\b"
)


def _normalize(text: str) -> str:
    """Normalise casse et accents pour le rapprochement des expressions."""
    decomposed = unicodedata.normalize("NFKD", text).casefold()
    return "".join(character for character in decomposed if not unicodedata.combining(character))


def detect_distress(message: str, sentiment_score: float | None = None) -> bool:
    """Détecte une expression de détresse ou un score de sentiment très bas."""
    normalized_message = _IDIOM_PATTERN.sub(" ", _normalize(message))
    if any(pattern.search(normalized_message) for pattern in _COMPILED_PATTERNS):
        return True
    return sentiment_score is not None and sentiment_score <= SENTIMENT_THRESHOLD


def distress_message(lang: str = "fr") -> str:
    """Renvoie un message de soutien fixe avec les ressources configurées."""
    messages = {
        "fr": (
            "Je suis désolé que tu traverses quelque chose d'aussi difficile, et tu n'as pas "
            "à rester seul·e avec ça. Si tu le peux, parle dès maintenant à une personne de "
            "confiance ou à un professionnel de santé. Au Maroc, appelle le 15 pour les "
            "secours ou le 19 pour la police si tu es en danger immédiat. Tu peux aussi "
            "contacter {resource}."
        ),
        "en": (
            "I'm sorry you're going through something so difficult, and you don't have to "
            "face it alone. If you can, talk now with someone you trust or a health "
            "professional. In Morocco, call 15 for emergency services or 19 for the police "
            "if you are in immediate danger. For support, here are the contact details for "
            "Ynov Campus Maroc: {resource}."
        ),
        "ar": (
            "أنا آسف لأنك تمر بوقت صعب، ولست مضطراً لمواجهة ذلك وحدك. إذا استطعت، تحدث الآن "
            "مع شخص تثق به أو مع مختص صحي. في المغرب، اتصل بالرقم 15 للإسعاف أو 19 للشرطة "
            "إذا كنت في خطر فوري. للتواصل مع الدعم في Ynov Campus Maroc، إليك معلومات "
            "الاتصال: {resource}."
        ),
    }
    return messages.get(lang.lower(), messages["fr"]).format(
        resource=settings.SUPPORT_RESOURCE_TEXT
    )
