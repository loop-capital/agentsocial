import type {
  AdobeExpressConfig,
  GenerateImageOptions,
  EditImageOptions,
  TemplateBrowserOptions,
  QuickActionOptions,
  ImageResult,
} from "./types.js";

const CDN_URL = "https://cc-embed.adobe.com/sdk/v4/CCEverywhere.js";

declare global {
  interface Window {
    CCEverywhere: {
      initialize: (params: any, config: any) => Promise<any>;
    };
  }
}

export class AdobeExpressEmbed {
  private config: AdobeExpressConfig;
  private sdk: any = null;
  private loaded = false;

  constructor(config: AdobeExpressConfig) {
    this.config = config;
  }

  async load(): Promise<void> {
    if (this.loaded) return;

    // Load SDK script
    if (typeof window === "undefined") {
      throw new Error("Adobe Express Embed SDK requires a browser environment");
    }

    if (!window.CCEverywhere) {
      await new Promise<void>((resolve, reject) => {
        const script = document.createElement("script");
        script.src = CDN_URL;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error("Failed to load Adobe Express SDK"));
        document.head.appendChild(script);
      });
    }

    // Initialize SDK
    this.sdk = await window.CCEverywhere.initialize(
      {
        clientId: this.config.apiKey,
        appName: this.config.appName,
      },
      {
        locale: "en-US",
        env: "prod",
      }
    );

    this.loaded = true;
  }

  async generateImage(options: GenerateImageOptions): Promise<ImageResult> {
    await this.load();
    return new Promise((resolve, reject) => {
      this.sdk.createModule("generate-image", {
        inputParams: {
          prompt: options.prompt,
        },
        outputParams: {
          outputType: "base64",
        },
      }).then((module: any) => {
        module.on("complete", (result: ImageResult) => {
          options.onComplete?.(result);
          resolve(result);
        });
        module.on("cancel", () => {
          options.onCancel?.();
          reject(new Error("User cancelled"));
        });
        module.on("error", (err: any) => reject(err));
        module.launch();
      }).catch(reject);
    });
  }

  async editImage(options: EditImageOptions): Promise<ImageResult> {
    await this.load();
    return new Promise((resolve, reject) => {
      const moduleConfig: any = {
        outputParams: { outputType: "base64" },
      };
      if (options.assetUrl) {
        moduleConfig.inputParams = { assetUrl: options.assetUrl };
      }

      this.sdk.createModule("edit-image", moduleConfig).then((module: any) => {
        module.on("complete", (result: ImageResult) => {
          options.onComplete?.(result);
          resolve(result);
        });
        module.on("cancel", () => {
          options.onCancel?.();
          reject(new Error("User cancelled"));
        });
        module.on("error", (err: any) => reject(err));
        module.launch();
      }).catch(reject);
    });
  }

  async browseTemplates(options: TemplateBrowserOptions): Promise<ImageResult> {
    await this.load();
    return new Promise((resolve, reject) => {
      this.sdk.createModule("template-browser", {
        outputParams: { outputType: "base64" },
      }).then((module: any) => {
        module.on("complete", (result: ImageResult) => {
          options.onComplete?.(result);
          resolve(result);
        });
        module.on("cancel", () => {
          options.onCancel?.();
          reject(new Error("User cancelled"));
        });
        module.on("error", (err: any) => reject(err));
        module.launch();
      }).catch(reject);
    });
  }

  async quickAction(options: QuickActionOptions): Promise<ImageResult> {
    await this.load();
    return new Promise((resolve, reject) => {
      const moduleConfig: any = {
        outputParams: { outputType: "base64" },
      };
      if (options.assetUrl) {
        moduleConfig.inputParams = { assetUrl: options.assetUrl };
      }

      this.sdk.createModule(`quick-action:${options.type}`, moduleConfig).then((module: any) => {
        module.on("complete", (result: ImageResult) => {
          options.onComplete?.(result);
          resolve(result);
        });
        module.on("cancel", () => {
          options.onCancel?.();
          reject(new Error("User cancelled"));
        });
        module.on("error", (err: any) => reject(err));
        module.launch();
      }).catch(reject);
    });
  }

  async openEditor(assetUrl?: string): Promise<ImageResult> {
    await this.load();
    return new Promise((resolve, reject) => {
      const editorConfig: any = {
        outputParams: { outputType: "base64" },
      };
      if (assetUrl) {
        editorConfig.inputParams = { assetUrl };
      }

      this.sdk.createEditor(editorConfig).then((editor: any) => {
        editor.on("complete", (result: ImageResult) => resolve(result));
        editor.on("cancel", () => reject(new Error("User cancelled")));
        editor.on("error", (err: any) => reject(err));
        editor.launch();
      }).catch(reject);
    });
  }
}

export function createAdobeExpress(config: AdobeExpressConfig): AdobeExpressEmbed {
  return new AdobeExpressEmbed(config);
}
