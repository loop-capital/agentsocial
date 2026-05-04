import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import fp from "fastify-plugin";

/**
 * Fastify preHandler hook that:
 * - Extracts Bearer token from Authorization header
 * - Verifies JWT
 * - Attaches user to request object
 * - Returns 401 on missing/invalid token
 */
export async function requireAuth(
  this: FastifyInstance,
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  try {
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return reply.status(401).send({
        error: {
          code: "authentication_required",
          message: "Missing or invalid Authorization header",
          request_id: request.id,
        },
      });
    }

    const token = authHeader.slice(7); // Remove "Bearer " prefix
    const decoded = await request.jwtVerify<{ sub: string; email?: string }>();
    request.userId = decoded.sub;
  } catch (err) {
    return reply.status(401).send({
      error: {
        code: "authentication_required",
        message: "Invalid or expired token",
        request_id: request.id,
      },
    });
  }
}

// Fastify plugin wrapper for global registration
export default fp(async function authMiddlewarePlugin(server: FastifyInstance) {
  server.decorate("requireAuth", requireAuth);
}, {
  name: "auth-middleware",
  dependencies: ["auth"], // depends on authPlugin which registers JWT
});
