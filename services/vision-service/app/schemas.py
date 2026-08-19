from pydantic import BaseModel, HttpUrl


class AnalyzeImageRequest(BaseModel):
  image_url: HttpUrl


class FaceAnalysisResponse(BaseModel):
  face_shape: str
  skin_tone: str
  dominant_features: list[str]


class BodyAnalysisResponse(BaseModel):
  body_type: str
  proportions: list[str]
