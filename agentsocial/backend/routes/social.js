// Social routes (posts, likes, comments)
const { z } = require('zod');

// Post schema
const postSchema = z.object({
  content: z.string().min(1).max(5000),
  imageUrl: z.string().url().optional()
});

// Comment schema
const commentSchema = z.object({
  content: z.string().min(1).max(1000)
});

// Helper to handle errors
const handleError = (reply, error) => {
  console.error(error);
  if (error instanceof z.ZodError) {
    return reply.status(400).send({ error: 'Validation failed', details: error.errors });
  }
  return reply.status(500).send({ error: 'Internal server error' });
};

module.exports = async function socialRoutes(fastify, options) {
  // Create a new post
  fastify.post('/', async (request, reply) => {
    try {
      // Verify the agent is authenticated (simplified for now)
      const { agentId } = request.body;
      const postData = postSchema.parse(request.body);
      
      // Check if agent exists
      const agent = await fastify.prisma.agent.findUnique({ where: { id: agentId } });
      if (!agent) {
        return reply.status(404).send({ error: 'Agent not found' });
      }

      const post = await fastify.prisma.post.create({
        data: {
          content: postData.content,
          imageUrl: postData.imageUrl,
          authorId: agentId
        },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              avatar: true
            }
          }
        }
      });

      // Notify followers (simplified - in real app, this would be background job)
      const followers = await fastify.prisma.follow.findMany({
        where: { followerId: agentId },
        select: { followingId: true }
      });
      
      for (const follower of followers) {
        await fastify.prisma.notification.create({
          data: {
            type: 'post',
            title: 'New Post',
            body: `${agent.name} shared a new post`,
            relatedId: post.id,
            relatedType: 'post',
            agentId: follower.followingId
          }
        });
      }

      return reply.status(201).send(post);
    } catch (error) {
      return handleError(reply, error);
    }
  });

  // Get posts (feed)
  fastify.get('/', async (request, reply) => {
    try {
      const { limit = 10, offset = 0, agentId } = request.query;

      let posts;
      if (agentId) {
        // Get posts from agents that the specified agent follows
        const following = await fastify.prisma.follow.findMany({
          where: { followerId: agentId },
          select: { followingId: true }
        });
        const followingIds = following.map(f => f.followingId);
        
        posts = await fastify.prisma.post.findMany({
          where: {
            authorId: {
              in: followingIds.length > 0 ? followingIds : [''] // If not following anyone, return empty
            }
          },
          take: parseInt(limit),
          skip: parseInt(offset),
          orderBy: { createdAt: 'desc' },
          include: {
            author: {
              select: {
                id: true,
                name: true,
                avatar: true
              }
            },
            _count: {
              select: { comments: true }
            }
          }
        });
      } else {
        // Get global feed
        posts = await fastify.prisma.post.findMany({
          take: parseInt(limit),
          skip: parseInt(offset),
          orderBy: { createdAt: 'desc' },
          include: {
            author: {
              select: {
                id: true,
                name: true,
                avatar: true
              }
            },
            _count: {
              select: { comments: true }
            }
          }
        });
      }

      return reply.send(posts);
    } catch (error) {
      return handleError(reply, error);
    }
  });

  // Get a single post
  fastify.get('/:id', async (request, reply) => {
    try {
      const { id } = request.params;
      const post = await fastify.prisma.post.findUnique({
        where: { id },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              avatar: true
            }
          },
          comments: {
            include: {
              author: {
                select: {
                  id: true,
                  name: true,
                  avatar: true
                }
              }
            },
            orderBy: { createdAt: 'asc' }
          }
        }
      });

      if (!post) {
        return reply.status(404).send({ error: 'Post not found' });
      }

      return reply.send(post);
    } catch (error) {
      return handleError(reply, error);
    }
  });

  // Update a post
  fastify.put('/:id', async (request, reply) => {
    try {
      const { id } = request.params;
      const { agentId, content, imageUrl } = request.body;

      // Check if post exists and belongs to agent
      const post = await fastify.prisma.post.findUnique({ where: { id } });
      if (!post) {
        return reply.status(404).send({ error: 'Post not found' });
      }

      if (post.authorId !== agentId) {
        return reply.status(403).send({ error: 'Not authorized to update this post' });
      }

      const updatedPost = await fastify.prisma.post.update({
        where: { id },
        data: {
          content: content ?? post.content,
          imageUrl: imageUrl ?? post.imageUrl
        },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              avatar: true
            }
          }
        }
      });

      return reply.send(updatedPost);
    } catch (error) {
      return handleError(reply, error);
    }
  });

  // Delete a post
  fastify.delete('/:id', async (request, reply) => {
    try {
      const { id } = request.params;
      const { agentId } = request.body;

      // Check if post exists and belongs to agent
      const post = await fastify.prisma.post.findUnique({ where: { id } });
      if (!post) {
        return reply.status(404).send({ error: 'Post not found' });
      }

      if (post.authorId !== agentId) {
        return reply.status(403).send({ error: 'Not authorized to delete this post' });
      }

      await fastify.prisma.post.delete({ where: { id } });
      return reply.status(204).send();
    } catch (error) {
      return handleError(reply, error);
    }
  });

  // Like a post
  fastify.post('/:id/like', async (request, reply) => {
    try {
      const { id } = request.params;
      const { agentId } = request.body;

      // Check if post exists
      const post = await fastify.prisma.post.findUnique({ where: { id } });
      if (!post) {
        return reply.status(404).send({ error: 'Post not found' });
      }

      // Check if agent exists
      const agent = await fastify.prisma.agent.findUnique({ where: { id: agentId } });
      if (!agent) {
        return reply.status(404).send({ error: 'Agent not found' });
      }

      // Increment like count
      const updatedPost = await fastify.prisma.post.update({
        where: { id },
        data: { likes: { increment: 1 } }
      });

      // Create notification for post author (if not liking own post)
      if (post.authorId !== agentId) {
        await fastify.prisma.notification.create({
          data: {
            type: 'like',
            title: 'New Like',
            body: `${agent.name} liked your post`,
            relatedId: id,
            relatedType: 'post',
            agentId: post.authorId
          }
        });
      }

      return reply.send({ likes: updatedPost.likes });
    } catch (error) {
      return handleError(reply, error);
    }
  });

  // Unlike a post
  fastify.delete('/:id/like', async (request, reply) => {
    try {
      const { id } = request.params;
      const { agentId } = request.body;

      // Check if post exists
      const post = await fastify.prisma.post.findUnique({ where: { id } });
      if (!post) {
        return reply.status(404).send({ error: 'Post not found' });
      }

      // Decrement like count (ensure it doesn't go below 0)
      const updatedPost = await fastify.prisma.post.update({
        where: { id },
        data: { likes: { decrement: 1 } }
      });

      return reply.send({ likes: Math.max(0, updatedPost.likes) });
    } catch (error) {
      return handleError(reply, error);
    }
  });

  // Add a comment to a post
  fastify.post('/:id/comment', async (request, reply) => {
    try {
      const { id: postId } = request.params;
      const { agentId, content } = request.body;

      // Check if post exists
      const post = await fastify.prisma.post.findUnique({ where: { id: postId } });
      if (!post) {
        return reply.status(404).send({ error: 'Post not found' });
      }

      // Check if agent exists
      const agent = await fastify.prisma.agent.findUnique({ where: { id: agentId } });
      if (!agent) {
        return reply.status(404).send({ error: 'Agent not found' });
      }

      // Validate comment
      const commentData = commentSchema.parse({ content });

      // Create comment
      const comment = await fastify.prisma.comment.create({
        data: {
          content: commentData.content,
          authorId: agentId,
          postId
        },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              avatar: true
            }
          }
        }
      });

      // Create notification for post author (if not commenting on own post)
      if (post.authorId !== agentId) {
        await fastify.prisma.notification.create({
          data: {
            type: 'comment',
            title: 'New Comment',
            body: `${agent.name} commented on your post`,
            relatedId: postId,
            relatedType: 'post',
            agentId: post.authorId
          }
        });
      }

      return reply.status(201).send(comment);
    } catch (error) {
      return handleError(reply, error);
    }
  });
};