// Type definitions for Adobe Express Embed SDK V4
// https://developer.adobe.com/express/embed-sdk/

export interface CCEverywhereConfig {
  clientId: string;
  appName: string;
  redirectUri?: string;
  baseUrl?: string;
  locale?: string;
}

export interface ExportConfig {
  target?: "Editor" | "Download" | "Host";
  format?: "png" | "jpg" | "mp4";
  quality?: number;
}

export interface ImageDocConfig {
  asset?: string | ArrayBuffer;
  assetType?: "base64" | "url";
  exportConfig?: ExportConfig;
}

export interface TextToImageParams {
  prompt: string;
  n?: number;
  size?: string;
  exportConfig?: ExportConfig;
}

export interface TemplateSearchParams {
  query?: string;
  category?: string;
  size?: string;
}

export interface PublishParams {
  asset?: ArrayBuffer;
  assetType?: string;
  exportButton?: string;
}

export interface CCEverywhereCallbacks {
  onPublish?: (publishParams: PublishParams) => void;
  onCancel?: () => void;
  onError?: (error: Error) => void;
  onClose?: () => void;
}

export interface CCEverywhereModule {
  createImageFromText(
    params: TextToImageParams,
    callbacks?: CCEverywhereCallbacks
  ): void;
  startFromContent(
    params?: TemplateSearchParams,
    callbacks?: CCEverywhereCallbacks
  ): void;
  editImage(
    docConfig: ImageDocConfig,
    callbacks?: CCEverywhereCallbacks
  ): void;
  viewDesign(
    docConfig: ImageDocConfig,
    callbacks?: CCEverywhereCallbacks
  ): void;
}

export interface CCEverywhereInstance {
  module: CCEverywhereModule;
}

export interface CCEverywhereAPI {
  initialize(config: CCEverywhereConfig): Promise<CCEverywhereInstance>;
}

declare global {
  interface Window {
    CCEverywhere: CCEverywhereAPI;
  }
}
