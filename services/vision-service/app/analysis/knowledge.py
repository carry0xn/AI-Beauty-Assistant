from __future__ import annotations

from functools import lru_cache
import hashlib
from pathlib import Path
import re
import math

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
        "Podés probar cortes en capas, con mechones que enmarquen el rostro y movimiento cerca de la mandíbula para suavizar visualmente sus ángulos.",
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


def _chunks(text: str, size: int = 3) -> list[str]:
    sentences = _split_sentences(text)
    return [" ".join(sentences[index : index + size]) for index in range(0, len(sentences), size)]


def _embedding(text: str, dimensions: int = 256) -> list[float]:
    """Create a deterministic local embedding from words and character n-grams."""
    vector = [0.0] * dimensions
    normalized = _normalize(text)
    tokens = re.findall(r"[a-záéíóúüñ]+", normalized)
    features = tokens + [normalized[index : index + 3] for index in range(max(0, len(normalized) - 2))]
    for feature in features:
        digest = hashlib.blake2b(feature.encode("utf-8"), digest_size=4).digest()
        index = int.from_bytes(digest, "big") % dimensions
        vector[index] += 1.0
    norm = math.sqrt(sum(value * value for value in vector))
    return [value / norm for value in vector] if norm else vector


def _cosine(left: list[float], right: list[float]) -> float:
    return sum(a * b for a, b in zip(left, right))


@lru_cache(maxsize=64)
def _pdf_chunks(path: str, modified_ns: int) -> tuple[str, ...]:
    del modified_ns
    return tuple(_chunks(_pdf_text(Path(path))))


def _extract_evidence(knowledge_dir: Path, shape: str, undertone: str) -> list[str]:
    scored_chunks: list[tuple[float, str, str]] = []
    if not knowledge_dir.exists():
        return []

    keywords = _SHAPE_KEYWORDS.get(shape, []) + _UNDERTONE_KEYWORDS.get(undertone, [])
    if not keywords:
        return []

    query = _embedding(" ".join(keywords))

    for pdf_path in sorted(knowledge_dir.glob("*.pdf")):
        try:
            chunks = _pdf_chunks(str(pdf_path), pdf_path.stat().st_mtime_ns)
        except Exception:
            continue

        for chunk in chunks:
            score = _cosine(query, _embedding(chunk))
            if score > 0:
                scored_chunks.append((score, pdf_path.name, chunk))

    scored_chunks.sort(reverse=True)
    return [
        f"{source} ({score:.2f}): {chunk[:240]}"
        for score, source, chunk in scored_chunks[:4]
    ]

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
