from __future__ import annotations

from pathlib import Path
import re

from pypdf import PdfReader


_SHAPE_TIPS = {
    "oval": [
        "Mantené volumen medio en laterales para conservar equilibrio.",
        "En maquillaje, priorizá definición suave de pómulos y cejas."
    ],
    "round": [
        "Buscá altura en coronilla y laterales controlados para estilizar.",
        "Contour diagonal suave desde sien hacia pómulo para mayor estructura."
    ],
    "square": [
        "Capas y movimiento alrededor de mandíbula para suavizar ángulos.",
        "Rubor en trazos circulares y luminosidad central para balancear rasgos."
    ],
    "heart": [
        "Aportá volumen cerca de mentón para compensar la frente amplia.",
        "Iluminá zona mandibular y mantené cejas de arco moderado."
    ],
    "oblong": [
        "Preferí flequillos o líneas horizontales para acortar visualmente.",
        "Evita excesiva altura en peinado; agregá anchura lateral."
    ],
}

_UNDERTONE_TIPS = {
    "warm": [
        "Paletas tierra, coral, dorados y verde oliva suelen armonizar mejor.",
        "Metales cálidos (oro, bronce) tienden a favorecer más que plateados fríos."
    ],
    "cool": [
        "Paletas ciruela, rosa frío, azul profundo y plata suelen favorecer.",
        "Buscá bases con subtono rosado o neutro-frío para evitar oxidación cálida."
    ],
    "neutral": [
        "Combiná gamas cálidas y frías según contraste de ojos/cabello.",
        "En maquillaje, podés alternar metales cálidos y fríos según look."
    ],
}

_SHAPE_KEYWORDS = {
    "oval": ["oval", "equilibr", "proporcion", "balance"],
    "round": ["redond", "circular", "alargar", "vertical"],
    "square": ["cuadrad", "mandib", "angulo", "suav"],
    "heart": ["corazon", "frente", "menton", "triang"],
    "oblong": ["alargad", "oblong", "horizontal", "acortar"],
}

_UNDERTONE_KEYWORDS = {
    "warm": ["calid", "dorado", "oliva", "coral", "tierra"],
    "cool": ["frio", "plata", "azul", "ciruela", "rosado"],
    "neutral": ["neutral", "equilibr", "mixto", "ambos"],
}


def _pdf_text(path: Path) -> str:
    reader = PdfReader(str(path))
    chunks: list[str] = []
    for page in reader.pages[:6]:
        content = page.extract_text() or ""
        if content.strip():
            chunks.append(content)
    return "\n".join(chunks)


def _normalize(text: str) -> str:
    lowered = text.lower()
    return re.sub(r"\s+", " ", lowered).strip()


def _split_sentences(text: str) -> list[str]:
    raw = re.split(r"(?<=[\.!?])\s+", text)
    return [s.strip() for s in raw if len(s.strip()) >= 45]


def _best_sentence(text: str, keywords: list[str]) -> str | None:
    sentences = _split_sentences(text)
    best: tuple[int, str] | None = None
    for sentence in sentences:
        normalized = _normalize(sentence)
        score = sum(1 for keyword in keywords if keyword in normalized)
        if score == 0:
            continue
        if best is None or score > best[0]:
            best = (score, sentence)
    return best[1] if best else None


def _extract_evidence(knowledge_dir: Path, shape: str, undertone: str) -> list[str]:
    evidences: list[str] = []
    if not knowledge_dir.exists():
        return evidences

    keywords = _SHAPE_KEYWORDS.get(shape, []) + _UNDERTONE_KEYWORDS.get(undertone, [])
    if not keywords:
        return evidences

    for pdf_path in sorted(knowledge_dir.glob("*.pdf")):
        try:
            text = _pdf_text(pdf_path)
        except Exception:
            continue

        sentence = _best_sentence(text, keywords)
        if sentence:
            evidences.append(f"{pdf_path.name}: {sentence[:240]}")

        if len(evidences) >= 4:
            break

    return evidences


def _list_pdf_sources(knowledge_dir: Path) -> list[str]:
    if not knowledge_dir.exists():
        return []
    return sorted([path.name for path in knowledge_dir.glob("*.pdf")])


def build_face_recommendations(shape: str, undertone: str, knowledge_dir: Path) -> dict:
    shape_tips = _SHAPE_TIPS.get(shape, ["Todavía no hay reglas específicas para esta forma."])
    undertone_tips = _UNDERTONE_TIPS.get(
        undertone, ["Todavía no hay reglas específicas para este subtono."]
    )
    sources = _list_pdf_sources(knowledge_dir)
    evidence = _extract_evidence(knowledge_dir, shape=shape, undertone=undertone)

    return {
        "recommendations": {
            "face_shape": shape_tips,
            "colorimetry": undertone_tips,
            "evidence": evidence,
        },
        "knowledge_sources": sources,
    }
