export interface AdobeExpressConfig {
  apiKey: string;
  appName: string;
  clientId?: string;
}

export interface InitializeParams {
  clientId: string;
  appName: string;
}

export interface ConfigParams {
  locale?: string;
  env?: "prod" | "stage";
}

export interface GenerateImageOptions {
  prompt: string;
  onComplete?: (result: ImageResult) => void;
  onCancel?: () => void;
}

export interface EditImageOptions {
  assetUrl?: string;
  onComplete?: (result: ImageResult) => void;
  onCancel?: () => void;
}

export interface TemplateBrowserOptions {
  onComplete?: (result: ImageResult) => void;
  onCancel?: () => void;
}

export interface ImageResult {
  assetId?: string;
  assetUrl?: string;
  assetName?: string;
  type?: string;
}

export interface QuickActionOptions {
  type: "resize" | "crop" | "trim" | "remove-background" | "compress";
  assetUrl?: string;
  onComplete?: (result: ImageResult) => void;
  onCancel?: () => void;
}
