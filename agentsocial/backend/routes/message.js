// Message routes
const { z } = require('zod');

// Message schema
const messageSchema = z.object({
  content: z.string().min(1).max(2000),
  receiverId: z.string(),
  conversationId: z.string().optional()
});

// Helper to handle errors
const handleError = (reply, error) => {
  console.error(error);
  if (error instanceof z.ZodError) {
    return reply.status(400).send({ error: 'Validation failed', details: error.errors });
  }
  return reply.status(500).send({ error: 'Internal server error' );
};

module.exports = async function messageRoutes(fastify, options) {
  // Send a new message
  fastify.post('/', async (request, reply) => {
    try {
      // Verify the agent is authenticated (simplified for now)
      const { senderId } = request.body;
      const messageData = messageSchema.parse(request.body);
      
      // Check if sender exists
      const sender = await fastify.prisma.agent.findUnique({ where: { id: senderId } });
      if (!sender) {
        return reply.status(404).send({ error: 'Sender agent not found' });
      }

      // Check if receiver exists
      const receiver = await fastify.prisma.agent.findUnique({ where: { id: messageData.receiverId } });
      if (!receiver) {
        return reply.status(404).send({ error: 'Receiver agent not found' });
      }

      // Determine conversation ID
      let conversationId = messageData.conversationId;
      if (!conversationId) {
        // Check if conversation already exists between these two agents
        const existingConversation = await fastify.prisma.conversation.findFirst({
          where: {
            participants: {
              every: {
                id: {
                  in: [senderId, messageData.receiverId]
                }
              }
            }
          }
        });

        if (existingConversation) {
          conversationId = existingConversation.id;
        } else {
          // Create new conversation
          const newConversation = await fastify.prisma.conversation.create({
            data: {
              participants: {
                connect: [
                  { id: senderId },
                  { id: messageData.receiverId }
                ]
              }
            }
          });
          conversationId = newConversation.id;
        }
      }

      // Create the message
      const message = await fastify.prisma.message.create({
        data: {
          content: messageData.content,
          senderId,
          receiverId: messageData.receiverId,
          conversationId
        },
        include: {
          sender: {
            select: {
              id: true,
              name: true,
              avatar: true
            }
          }
        }
      });

      // Update conversation timestamp
      await fastify.prisma.conversation.update({
        where: { id: conversationId },
        data: { updatedAt: new Date() }
      });

      // Create notification for receiver
      await fastify.prisma.notification.create({
        data: {
          type: 'message',
          title: 'New Message',
          body: `${sender.name} sent you a message`,
          relatedId: message.id,
          relatedType: 'message',
          agentId: messageData.receiverId
        }
      });

      return reply.status(201).send(message);
    } catch (error) {
      return handleError(reply, error);
    }
  });

  // Get messages for a conversation
  fastify.get('/:conversationId', async (request, reply) => {
    try {
      const { conversationId } = request.params;
      const { limit = 50, offset = 0 } = request.query;

      const messages = await fastify.prisma.message.findMany({
        where: { conversationId },
        take: parseInt(limit),
        skip: parseInt(offset),
        orderBy: { createdAt: 'asc' },
        include: {
          sender: {
            select: {
              id: true,
              name: true,
              avatar: true
            }
          }
        }
      });

      // Mark messages as read for the requesting agent (simplified)
      // In a real app, you'd check which agent is requesting and mark accordingly
      await fastify.prisma.message.updateMany({
        where: {
          conversationId,
          isRead: false
        },
        data: { isRead: true }
      });

      return reply.send(messages);
    } catch (error) {
      return handleError(reply, error);
    }
  });

  // Get conversations for an agent
  fastify.get('/agent/:agentId', async (request, reply) => {
    try {
      const { agentId } = request.params;
      const { limit = 10, offset = 0 } = request.query;

      const conversations = await fastify.prisma.conversation.findMany({
        where: {
          participants: {
            some: {
              id: agentId
            }
          }
        },
        take: parseInt(limit),
        skip: parseInt(offset),
        orderBy: { updatedAt: 'desc' },
        include: {
          participants: {
            select: {
              id: true,
              name: true,
              avatar: true
            }
          },
          messages: {
            take: 1,
            orderBy: { createdAt: 'desc' },
            include: {
              sender: {
                select: {
                  id: true,
                  name: true,
                  avatar: true
                }
              }
            }
          }
        }
      });

      return reply.send(conversations);
    } catch (error) {
      return handleError(reply, error);
    }
  });

  // Mark notifications as read
  fastify.put('/notifications/:id/read', async (request, reply) => {
    try {
      const { id } = request.params;
      const { agentId } = request.body;

      // Check if notification exists and belongs to agent
      const notification = await fastify.prisma.notification.findFirst({
        where: { id, agentId }
      });

      if (!notification) {
        return reply.status(404).send({ error: 'Notification not found' });
      }

      const updatedNotification = await fastify.prisma.notification.update({
        where: { id },
        data: { isRead: true }
      });

      return reply.send(updatedNotification);
    } catch (error) {
      return handleError(reply, error);
    }
  });

  // Get unread notification count for an agent
  fastify.get('/notifications/unread-count/:agentId', async (request, reply) => {
    try {
      const { agentId } = request.params;
      const count = await fastify.prisma.notification.count({
        where: {
          agentId,
          isRead: false
        }
      });

      return reply.send({ count });
    } catch (error) {
      return handleError(reply, error);
    }
  });
};