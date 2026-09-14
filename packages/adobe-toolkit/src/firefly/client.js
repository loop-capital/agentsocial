"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FireflyClient = void 0;
const FIREFLY_BASE = 'https://firefly-api.adobe.io';
const AUTH_URL = 'https://ims-na1.adobelogin.com/ims/token/v3';
/** Required scopes for Firefly Services */
const FIREFLY_SCOPES = 'openid,AdobeID,session,additional_info,read_organizations,firefly_api,ff_apis';
class FireflyClient {
    constructor(config) {
        this.auth = null;
        this.config = {
            clientId: config.clientId,
            clientSecret: config.clientSecret,
            apiBase: config.apiBase ?? FIREFLY_BASE,
            authBase: config.authBase ?? AUTH_URL,
        };
    }
    // ── Authentication ──────────────────────────────────────────────
    /** Exchange client credentials for an access token (OAuth Server-to-Server). */
    async authenticate() {
        // Reuse token until 60 seconds before expiry
        if (this.auth && Date.now() < this.auth.expiresAt - 60000) {
            return this.auth;
        }
        const params = new URLSearchParams();
        params.append('grant_type', 'client_credentials');
        params.append('client_id', this.config.clientId);
        params.append('client_secret', this.config.clientSecret);
        params.append('scope', FIREFLY_SCOPES);
        const response = await fetch(this.config.authBase, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: params.toString(),
        });
        const data = await response.json();
        if (!response.ok) {
            throw new Error(`Adobe Auth Error (${response.status}): ${data.error_description || data.error || JSON.stringify(data)}`);
        }
        this.auth = {
            accessToken: data.access_token,
            expiresAt: Date.now() + data.expires_in * 1000,
            tokenType: data.token_type || 'bearer',
        };
        return this.auth;
    }
    /** Make an authenticated request to the Firefly API. */
    async request(endpoint, options = {}) {
        const auth = await this.authenticate();
        const url = `${this.config.apiBase}${endpoint}`;
        const response = await fetch(url, {
            ...options,
            headers: {
                Authorization: `Bearer ${auth.accessToken}`,
                'x-api-key': this.config.clientId,
                'Content-Type': 'application/json',
                Accept: 'application/json',
                ...(options.headers || {}),
            },
        });
        const data = await response.json();
        if (!response.ok) {
            const error = data;
            throw new Error(`Firefly API Error (${response.status}): ${error.error_description || error.error || JSON.stringify(data)}`);
        }
        return data;
    }
    // ── Image Upload (required before fill/expand) ───────────────────
    /** Upload an image to Firefly storage for use with fill/expand/composite. */
    async uploadImage(fileBuffer, contentType = 'image/jpeg') {
        const auth = await this.authenticate();
        const response = await fetch(`${this.config.apiBase}/v2/storage/image`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${auth.accessToken}`,
                'X-API-Key': this.config.clientId,
                'Content-Type': contentType,
            },
            body: fileBuffer,
            // @ts-ignore - duplex needed for streaming uploads in Node 18+
            duplex: 'half',
        });
        const data = await response.json();
        if (!response.ok) {
            throw new Error(`Firefly Upload Error (${response.status}): ${JSON.stringify(data)}`);
        }
        return data;
    }
    // ── Generate Image (Async — recommended) ─────────────────────────
    /**
     * Generate image from text prompt (async).
     * Returns a job ID + status URL. Poll with `pollJob()` to get results.
     */
    async generateImageAsync(request) {
        const body = {
            prompt: request.prompt,
        };
        if (request.contentClass)
            body.contentClass = request.contentClass;
        if (request.negativePrompt)
            body.negativePrompt = request.negativePrompt;
        if (request.seed != null)
            body.seed = request.seed;
        if (request.size)
            body.size = request.size;
        if (request.style)
            body.style = request.style;
        if (request.numVariations)
            body.numVariations = request.numVariations;
        return this.request('/v3/images/generate-async', {
            method: 'POST',
            body: JSON.stringify(body),
        });
    }
    /**
     * Generate image from text prompt (synchronous).
     * Blocks until generation completes — may take 10-30s.
     */
    async generateImageSync(request) {
        const body = {
            prompt: request.prompt,
        };
        if (request.contentClass)
            body.contentClass = request.contentClass;
        if (request.negativePrompt)
            body.negativePrompt = request.negativePrompt;
        if (request.seed != null)
            body.seed = request.seed;
        if (request.size)
            body.size = request.size;
        if (request.style)
            body.style = request.style;
        return this.request('/v3/images/generate', {
            method: 'POST',
            body: JSON.stringify(body),
        });
    }
    // ── Generative Fill (Async) ──────────────────────────────────────
    /** Generative fill: inpaint a masked region of an uploaded image. */
    async generativeFillAsync(request) {
        return this.request('/v3/images/fill-async', {
            method: 'POST',
            body: JSON.stringify(request),
        });
    }
    // ── Expand Image / Outpainting (Async) ────────────────────────────
    /** Expand an image to a larger canvas size (outpainting). */
    async expandImageAsync(request) {
        return this.request('/v3/images/expand-async', {
            method: 'POST',
            body: JSON.stringify(request),
        });
    }
    // ── Generate Similar Images (Async) ──────────────────────────────
    /** Generate variations similar to a source image. */
    async generateSimilarAsync(uploadId, numVariations) {
        const body = {
            image: {
                source: { uploadId },
            },
        };
        if (numVariations)
            body.numVariations = numVariations;
        return this.request('/v3/images/generate-similar-async', {
            method: 'POST',
            body: JSON.stringify(body),
        });
    }
    // ── Object Composite (Async) ─────────────────────────────────────
    /** Composite an object into a scene. */
    async objectCompositeAsync(request) {
        return this.request('/v3/images/object-composite-async', {
            method: 'POST',
            body: JSON.stringify(request),
        });
    }
    // ── Job Polling ───────────────────────────────────────────────────
    /**
     * Poll an async job status URL until it succeeds or fails.
     * Polls every `intervalMs` (default 1000ms).
     * Times out after `timeoutMs` (default 120000ms = 2 min).
     */
    async pollJob(statusUrl, intervalMs = 1000, timeoutMs = 120000) {
        const start = Date.now();
        while (Date.now() - start < timeoutMs) {
            const auth = await this.authenticate();
            const response = await fetch(statusUrl, {
                headers: {
                    Authorization: `Bearer ${auth.accessToken}`,
                    'x-api-key': this.config.clientId,
                },
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(`Poll Error (${response.status}): ${JSON.stringify(data)}`);
            }
            if (data.status === 'succeeded' || data.status === 'failed') {
                return data;
            }
            // Wait before polling again
            await new Promise((resolve) => setTimeout(resolve, intervalMs));
        }
        throw new Error(`Job polling timed out after ${timeoutMs}ms`);
    }
    /** Cancel an async job using the cancelUrl from the job response. */
    async cancelJob(cancelUrl) {
        const auth = await this.authenticate();
        await fetch(cancelUrl, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${auth.accessToken}`,
                'x-api-key': this.config.clientId,
            },
        });
    }
    // ── Convenience: generate + poll + return result ──────────────────
    /**
     * Full pipeline: submit an async image generation job and wait for the result.
     * This is the easiest way to generate an image — just pass a prompt and wait.
     */
    async generateImage(request, intervalMs = 1000, timeoutMs = 120000) {
        const job = await this.generateImageAsync(request);
        const result = await this.pollJob(job.statusUrl, intervalMs, timeoutMs);
        if (result.status === 'failed' || !result.result) {
            throw new Error(`Image generation failed: ${JSON.stringify(result)}`);
        }
        return result.result;
    }
    /** Download a generated image from its pre-signed URL. */
    async downloadImage(imageUrl) {
        const response = await fetch(imageUrl);
        if (!response.ok) {
            throw new Error(`Download failed (${response.status})`);
        }
        return response.arrayBuffer();
    }
}
exports.FireflyClient = FireflyClient;
exports.default = FireflyClient;
