import os

RABBITMQ_URL = os.getenv("RABBITMQ_URL", "amqp://guest:guest@localhost:5672")
ANALYSES_QUEUE = os.getenv("ANALYSES_QUEUE", "analyses")

S3_ENDPOINT = os.getenv("S3_ENDPOINT", "http://localhost:9000")
S3_BUCKET = os.getenv("S3_BUCKET", "aura-photos")
S3_ACCESS_KEY = os.getenv("S3_ACCESS_KEY", "minioadmin")
S3_SECRET_KEY = os.getenv("S3_SECRET_KEY", "minioadmin")

BFF_URL = os.getenv("BFF_URL", "http://localhost:3001")
INTERNAL_API_KEY = os.getenv("INTERNAL_API_KEY", "aura-internal-dev-key")

_MODELS_DIR = os.path.join(os.path.dirname(__file__), "..", "models")
FACE_LANDMARKER_MODEL = os.getenv(
    "FACE_LANDMARKER_MODEL", os.path.join(_MODELS_DIR, "face_landmarker.task")
)

_DEFAULT_KNOWLEDGE_DIR = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "..", "..", "docs", "knowledge-base", "pdfs")
)
KNOWLEDGE_PDF_DIR = os.getenv("KNOWLEDGE_PDF_DIR", _DEFAULT_KNOWLEDGE_DIR)
