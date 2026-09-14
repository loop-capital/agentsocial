// Adobe Firefly API v3 Types (aligned with official docs)

export interface FireflyConfig {
  clientId: string;
  clientSecret: string;
  apiBase?: string; // defaults to https://firefly-api.adobe.io
  authBase?: string; // defaults to https://ims-na1.adobelogin.com/ims/token/v3
}

// --- Auth ---

export interface FireflyAuth {
  accessToken: string;
  expiresAt: number; // epoch ms
  tokenType: string; // "bearer"
}

// --- Image Generation ---

export interface GenerateImageRequest {
  prompt: string;
  contentClass?: 'photo' | 'art'; // Firefly v3 param
  negativePrompt?: string;
  aspectRatio?: '1:1' | '4:3' | '3:4' | '16:9' | '9:16';
  style?: {
    strength?: number; // 0-100
    preset?: string;   // e.g. "watercolor", "oil_painting"
  };
  seed?: number;
  numVariations?: number;
  size?: { width: number; height: number };
}

// Async job submission response
export interface GenerateAsyncJobResponse {
  jobId: string;  // e.g. "urn:ff:jobs:eso851211:86ffe2ea-..."
  statusUrl: string;
  cancelUrl: string;
}

// Async job polling result
export interface AsyncJobResult {
  status: 'running' | 'succeeded' | 'failed';
  jobId: string;
  result?: GenerateImageResponse;
}

// Synchronous generation response (legacy / direct)
export interface GenerateImageResponse {
  size: { width: number; height: number };
  outputs: GeneratedImage[];
  contentClass?: string;
  altText?: string;
}

export interface GeneratedImage {
  seed: number;
  image: {
    url: string; // pre-signed S3 URL
  };
}

// --- Generative Fill ---

export interface GenerativeFillRequest {
  image: {
    source: {
      uploadId: string; // from upload endpoint
    };
  };
  mask: {
    source: {
      uploadId: string;
    };
  };
  prompt: string;
}

// --- Image Expansion (Outpainting) ---

export interface ExpandImageRequest {
  image: {
    source: {
      uploadId: string;
    };
  };
  size: { width: number; height: number };
  prompt?: string;
}

// --- Upload ---

export interface UploadImageResponse {
  images: Array<{
    id: string;
  }>;
}

// --- Errors ---

export interface FireflyError {
  error: string;
  error_description?: string;
  code?: string;
  status?: number;
}