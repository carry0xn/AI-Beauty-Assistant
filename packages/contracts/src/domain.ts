export interface FaceAnalysis {
  faceShape: string;
  skinTone: string;
  dominantFeatures: string[];
}

export interface BodyAnalysis {
  bodyType: string;
  proportions: string[];
}

export interface Colorimetry {
  season: 'spring' | 'summer' | 'autumn' | 'winter';
  palette: string[];
}

export interface Recommendation {
  id: string;
  category: string;
  title: string;
  description: string;
}
