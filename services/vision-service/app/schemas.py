from pydantic import BaseModel, ConfigDict, HttpUrl


class AnalyzeImageRequest(BaseModel):
  image_url: HttpUrl


class FaceAnalysisResponse(BaseModel):
  model_config = ConfigDict(extra="allow")

  face_shape: str
  skin_tone: str
  dominant_features: list[str]


class BodyAnalysisResponse(BaseModel):
  body_type: str
  proportions: list[str]
