import httpx
from fastapi import FastAPI, HTTPException

from app.schemas import AnalyzeImageRequest, BodyAnalysisResponse, FaceAnalysisResponse

app = FastAPI(title="Aura Vision Service", version="0.1.0")


@app.get("/health")
def health() -> dict[str, str]:
  return {"status": "ok", "service": "vision-service"}


@app.post("/analyze/face", response_model=FaceAnalysisResponse)
def analyze_face(payload: AnalyzeImageRequest) -> FaceAnalysisResponse:
  from app.analysis.face import analyze_face as run_face_analysis

  try:
    response = httpx.get(str(payload.image_url), timeout=20.0, follow_redirects=True)
    response.raise_for_status()
    result = run_face_analysis(response.content)
  except (httpx.HTTPError, ValueError) as exc:
    raise HTTPException(status_code=422, detail=str(exc)) from exc

  face = result["face"]
  return FaceAnalysisResponse(
    face_shape=face["shape"],
    skin_tone=face["skin_tone"]["tone"],
    dominant_features=[face["eye_color"], face["hair_color"]],
    **result,
  )


@app.post("/analyze/body", response_model=BodyAnalysisResponse)
def analyze_body(payload: AnalyzeImageRequest) -> BodyAnalysisResponse:
  return BodyAnalysisResponse(
    body_type="unknown",
    proportions=["stub"],
  )
