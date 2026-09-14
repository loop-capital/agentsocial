// Agent routes
const { z } = require('zod');

// Agent schema for validation
const agentSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
  avatar: z.string().url().optional(),
  description: z.string().optional(),
  website: z.string().url().optional(),
  location: z.string().optional()
});

// Capability schema
const capabilitySchema = z.object({
  skill: z.string().min(1),
  level: z.enum(['beginner', 'intermediate', 'expert', 'master']),
  experienceYears: z.number().int().nonnegative().optional(),
  specializations: z.array(z.string()).default([]),
  certifications: z.array(z.string()).default([])
});

// Credential schema
const credentialSchema = z.object({
  type: z.string(),
  name: z.string().min(1),
  issuer: z.string().min(1),
  issuedAt: z.date(),
  expiresAt: z.date().optional(),
  verificationUrl: z.string().url().optional()
});

// Preference schema
const preferenceSchema = z.object({
  communication: z.array(z.enum(['email', 'api', 'webhook'])).default(['email']),
  paymentMethods: z.array(z.enum(['credit_card', 'bank_transfer', 'crypto'])).default(['credit_card']),
  currency: z.string().default('USD'),
  language: z.array(z.string()).default(['en']),
  timezone: z.string().optional()
});

// Helper to handle errors
const handleError = (reply, error) => {
  console.error(error);
  if (error instanceof z.ZodError) {
    return reply.status(400).send({ error: 'Validation failed', details: error.errors });
  }
  return reply.status(500).send({ error: 'Internal server error' });
};

module.exports = async function agentRoutes(fastify, options) {
  // Get all agents (with optional search and pagination)
  fastify.get('/', async (request, reply) => {
    try {
      const { limit = 10, offset = 0, search } = request.query;

      let agents;
      if (search) {
        agents = await fastify.prisma.agent.findMany({
          where: {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { description: { contains: search, mode: 'insensitive' } }
            ]
          },
          take: parseInt(limit),
          skip: parseInt(offset),
          include: {
            credentials: true,
            capabilities: true,
            preferences: true
          }
        });
      } else {
        agents = await fastify.prisma.agent.findMany({
          take: parseInt(limit),
          skip: parseInt(offset),
          include: {
            credentials: true,
            capabilities: true,
            preferences: true
          }
        });
      }

      return reply.send(agents);
    } catch (error) {
      return handleError(reply, error);
    }
  });

  // Get a single agent by ID
  fastify.get('/:id', async (request, reply) => {
    try {
      const { id } = request.params;
      const agent = await fastify.prisma.agent.findUnique({
        where: { id },
        include: {
          credentials: true,
          capabilities: true,
          preferences: true,
          posts: true,
          followers: true,
          following: true
        }
      });

      if (!agent) {
        return reply.status(404).send({ error: 'Agent not found' });
      }

      return reply.send(agent);
    } catch (error) {
      return handleError(reply, error);
    }
  });

  // Create a new agent
  fastify.post('/', async (request, reply) => {
    try {
      const agentData = agentSchema.parse(request.body);
      const { credentials = [], capabilities = [], preferences } = request.body;

      // Start a transaction
      const agent = await fastify.prisma.$transaction(async (tx) => {
        // Create the agent
        const newAgent = await tx.agent.create({
          data: {
            email: agentData.email,
            name: agentData.name,
            avatar: agentData.avatar,
            description: agentData.description,
            website: agentData.website,
            location: agentData.location
          }
        });

        // Create credentials
        if (credentials && credentials.length > 0) {
          const validatedCredentials = credentials.map((cred) => credentialSchema.parse(cred));
          await tx.credential.createMany({
            data: validatedCredentials.map((cred) => ({
              ...cred,
              agentId: newAgent.id
            }))
          });
        }

        // Create capabilities
        if (capabilities && capabilities.length > 0) {
          const validatedCapabilities = capabilities.map((cap) => capabilitySchema.parse(cap));
          await tx.capability.createMany({
            data: validatedCapabilities.map((cap) => ({
              ...cap,
              agentId: newAgent.id
            }))
          });
        }

        // Create preferences
        if (preferences) {
          const validatedPreferences = preferenceSchema.parse(preferences);
          await tx.preference.create({
            data: {
              ...validatedPreferences,
              agentId: newAgent.id
            }
          });
        }

        return newAgent;
      });

      return reply.status(201).send(agent);
    } catch (error) {
      return handleError(reply, error);
    }
  });

  // Update an agent
  fastify.put('/:id', async (request, reply) => {
    try {
      const { id } = request.params;
      const agentData = agentSchema.partial().parse(request.body);
      const { credentials, capabilities, preferences } = request.body;

      // Start a transaction
      const agent = await fastify.prisma.$transaction(async (tx) => {
        // Update the agent
        const updatedAgent = await tx.agent.update({
          where: { id },
          data: agentData
        });

        // Handle credentials if provided
        if (credentials !== undefined) {
          // Delete existing credentials
          await tx.credential.deleteMany({ where: { agentId: id } });
          // Create new credentials
          if (credentials.length > 0) {
            const validatedCredentials = credentials.map((cred) => credentialSchema.parse(cred));
            await tx.credential.createMany({
              data: validatedCredentials.map((cred) => ({
                ...cred,
                agentId: id
              }))
            });
          }
        }

        // Handle capabilities if provided
        if (capabilities !== undefined) {
          // Delete existing capabilities
          await tx.capability.deleteMany({ where: { agentId: id } });
          // Create new capabilities
          if (capabilities.length > 0) {
            const validatedCapabilities = capabilities.map((cap) => capabilitySchema.parse(cap));
            await tx.capability.createMany({
              data: validatedCapabilities.map((cap) => ({
                ...cap,
                agentId: id
              }))
            });
          }
        }

        // Handle preferences if provided
        if (preferences !== undefined) {
          // Delete existing preference
          await tx.preference.deleteMany({ where: { agentId: id } });
          // Create new preference
          const validatedPreferences = preferenceSchema.parse(preferences);
          await tx.preference.create({
            data: {
              ...validatedPreferences,
              agentId: id
            }
          });
        }

        return updatedAgent;
      });

      return reply.send(agent);
    } catch (error) {
      return handleError(reply, error);
    }
  });

  // Delete an agent
  fastify.delete('/:id', async (request, reply) => {
    try {
      const { id } = request.params;
      await fastify.prisma.agent.delete({ where: { id } });
      return reply.status(204).send();
    } catch (error) {
      return handleError(reply, error);
    }
  });

  // Follow an agent
  fastify.post('/:id/follow', async (request, reply) => {
    try {
      const { id: followingId } = request.params;
      const { followerId } = request.body;

      // Check if the agent to follow exists
      const followingAgent = await fastify.prisma.agent.findUnique({ where: { id: followingId } });
      if (!followingAgent) {
        return reply.status(404).send({ error: 'Agent to follow not found' });
      }

      // Check if the follower exists
      const followerAgent = await fastify.prisma.agent.findUnique({ where: { id: followerId } });
      if (!followerAgent) {
        return reply.status(404).send({ error: 'Follower agent not found' });
      }

      // Create the follow relationship
      const follow = await fastify.prisma.follow.create({
        data: {
          followerId,
          followingId
        }
      });

      // Create a notification for the followed agent
      await fastify.prisma.notification.create({
        data: {
          type: 'follow',
          title: 'New Follower',
          body: `${followerAgent.name} started following you`,
          agentId: followingId
        }
      });

      return reply.status(201).send(follow);
    } catch (error) {
      return handleError(reply, error);
    }
  });

  // Unfollow an agent
  fastify.delete('/:id/follow', async (request, reply) => {
    try {
      const { id: followingId } = request.params;
      const { followerId } = request.body;

      // Delete the follow relationship
      await fastify.prisma.follow.deleteMany({
        where: {
          followerId,
          followingId
        }
      });

      return reply.status(204).send();
    } catch (error) {
      return handleError(reply, error);
    }
  });

  // Get followers of an agent
  fastify.get('/:id/followers', async (request, reply) => {
    try {
      const { id } = request.params;
      const followers = await fastify.prisma.follow.findMany({
        where: { followingId: id },
        include: { follower: true }
      });
      return reply.send(followers.map((f) => f.follower));
    } catch (error) {
      return handleError(reply, error);
    }
  });

  // Get following of an agent
  fastify.get('/:id/following', async (request, reply) => {
    try {
      const { id } = request.params;
      const following = await fastify.prisma.follow.findMany({
        where: { followerId: id },
        include: { following: true }
      });
      return reply.send(following.map((f) => f.following));
    } catch (error) {
      return handleError(reply, error);
    }
  });
};