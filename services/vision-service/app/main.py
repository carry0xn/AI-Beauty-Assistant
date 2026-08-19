from fastapi import FastAPI

from app.schemas import AnalyzeImageRequest, BodyAnalysisResponse, FaceAnalysisResponse

app = FastAPI(title="Aura Vision Service", version="0.1.0")


@app.get("/health")
def health() -> dict[str, str]:
  return {"status": "ok", "service": "vision-service"}


@app.post("/analyze/face", response_model=FaceAnalysisResponse)
def analyze_face(payload: AnalyzeImageRequest) -> FaceAnalysisResponse:
  return FaceAnalysisResponse(
    face_shape="unknown",
    skin_tone="unknown",
    dominant_features=["stub"],
  )


@app.post("/analyze/body", response_model=BodyAnalysisResponse)
def analyze_body(payload: AnalyzeImageRequest) -> BodyAnalysisResponse:
  return BodyAnalysisResponse(
    body_type="unknown",
    proportions=["stub"],
  )
