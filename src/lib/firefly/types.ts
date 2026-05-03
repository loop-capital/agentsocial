export interface FireflyConfig {
  clientId: string;
  clientSecret: string;
  baseUrl?: string;
  tokenUrl?: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

export interface GenerateRequest {
  prompt: string;
  numVariations?: number;
  contentClass?: "photo" | "art" | "graphic";
  size?: {
    width: number;
    height: number;
  };
  style?: {
    presets?: string[];
    strength?: number;
  };
}

export interface GenerateResponse {
  jobId: string;
  status: "pending" | "processing" | "succeeded" | "failed";
  result?: {
    images: GeneratedImage[];
  };
  error?: string;
}

export interface GeneratedImage {
  imageUrl: string;
  seed: number;
  width: number;
  height: number;
}

export interface CompositeRequest {
  image: string; // base64 or URL
  prompt: string;
  placementHint?: string;
  harmonization?: {
    strength: number; // 0-100
  };
  size?: {
    width: number;
    height: number;
  };
}

export interface UpscaleRequest {
  image: string; // base64 or URL
  scaleFactor: 2 | 4 | 6;
  useCase?: "userAssets" | "generatedImage";
}

export interface UpscaleResponse {
  jobId: string;
  status: "pending" | "processing" | "succeeded" | "failed";
  result?: {
    imageUrl: string;
  };
  error?: string;
}

export interface CustomModel {
  assetId: string;
  name: string;
  type: "subject" | "style";
  status: string;
}
