/**
 * Cloudinary upload helper
 *
 * Used by generation wrappers to persist generated images/videos in Cloudinary.
 * Falls back to returning the source URL when Cloudinary is not configured.
 */

import { v2 as cloudinary } from "cloudinary";

let configured = false;

export function configureCloudinary() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (cloudName && apiKey && apiSecret) {
    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
    });
    configured = true;
  } else {
    configured = false;
  }
}

configureCloudinary();

export function isCloudinaryConfigured(): boolean {
  return configured;
}

function inferExtension(mimeType: string): string {
  const map: Record<string, string> = {
    "image/png": "png",
    "image/jpeg": "jpg",
    "image/jpg": "jpg",
    "image/webp": "webp",
    "image/gif": "gif",
    "video/mp4": "mp4",
    "video/webm": "webm",
    "video/quicktime": "mov",
  };
  return map[mimeType.toLowerCase()] || "bin";
}

export async function uploadBase64Image(
  data: string,
  mimeType: string,
  folder = "agentsocial/generated",
  publicId?: string
): Promise<string> {
  if (!configured) {
    throw new Error("Cloudinary is not configured");
  }

  const base64Uri = `data:${mimeType};base64,${data}`;
  const result = await cloudinary.uploader.upload(base64Uri, {
    folder,
    resource_type: "image",
    ...(publicId ? { public_id: publicId } : {}),
  });

  return result.secure_url;
}

export async function uploadFromUrl(
  url: string,
  folder = "agentsocial/generated",
  resourceType: "image" | "video" = "image"
): Promise<string> {
  if (!configured) {
    throw new Error("Cloudinary is not configured");
  }

  const result = await cloudinary.uploader.upload(url, {
    folder,
    resource_type: resourceType,
  });

  return result.secure_url;
}

/**
 * Upload a generated media item to Cloudinary, falling back to its existing URL
 * when Cloudinary is not configured.
 */
export async function persistGeneratedMedia(
  item: { data?: string; mimeType?: string; url?: string },
  folder = "agentsocial/generated",
  resourceType: "image" | "video" = "image"
): Promise<string> {
  if (item.url) {
    if (!configured) return item.url;
    return uploadFromUrl(item.url, folder, resourceType);
  }

  if (item.data && item.mimeType) {
    if (!configured) {
      return `data:${item.mimeType};base64,${item.data}`;
    }
    return uploadBase64Image(item.data, item.mimeType, folder);
  }

  throw new Error("Generated media item has neither URL nor base64 data");
}
