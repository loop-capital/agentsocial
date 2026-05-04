// API Routes for Browser Automation Channels
// Allows users to connect social accounts with username/password instead of OAuth

import { FastifyInstance } from "fastify";
import { db, channels } from "../db/index.js";
import { encryptToken } from "../connectors/token-store.js";
import { eq } from "drizzle-orm";

export async function browserAuthRoutes(fastify: FastifyInstance) {
  // POST /api/v1/channels/browser-connect
  // Connect a social account via browser automation (username/password)
  fastify.post("/browser-connect", async (request, reply) => {
    const { brandId, platform, username, password, name } = request.body as {
      brandId: string;
      platform: "instagram" | "facebook" | "tiktok";
      username: string;
      password: string;
      name?: string;
    };

    // Validate platform supports browser automation
    if (!["instagram", "facebook", "tiktok"].includes(platform)) {
      return reply.status(400).send({
        error: "Platform not supported for browser automation",
        supported: ["instagram", "facebook", "tiktok"],
      });
    }

    try {
      // Encrypt credentials
      const usernameEncrypted = encryptToken(username);
      const passwordEncrypted = encryptToken(password);

      // Create channel
      const [channel] = await db
        .insert(channels)
        .values({
          brandId,
          platform,
          name: name || `${platform} (${username})`,
          accountId: username,
          status: "active",
          authMethod: "browser",
          usernameEncrypted,
          passwordEncrypted,
          settings: {},
        })
        .returning();

      return {
        success: true,
        channel: {
          id: channel.id,
          name: channel.name,
          platform: channel.platform,
          status: channel.status,
          authMethod: "browser",
        },
        message: "Account connected via browser automation",
      };
    } catch (error) {
      console.error("Browser connect error:", error);
      return reply.status(500).send({
        error: "Failed to connect account",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  // GET /api/v1/channels/browser-supported
  // List platforms that support browser automation
  fastify.get("/browser-supported", async () => {
    return {
      platforms: [
        {
          id: "instagram",
          name: "Instagram",
          description: "Post photos and captions",
          requires: ["image"],
        },
        {
          id: "facebook",
          name: "Facebook",
          description: "Post photos and text",
          requires: ["image"],
        },
        {
          id: "tiktok",
          name: "TikTok",
          description: "Post videos with captions",
          requires: ["video"],
        },
      ],
      note: "Browser automation uses your personal login. No business verification required.",
    };
  });
}
