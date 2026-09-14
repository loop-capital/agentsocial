const Fastify = require('fastify');
const fastifyCors = require('@fastify/cors');
const fastifyJwt = require('@fastify/jwt');
const fastifyPostgres = require('@fastify/postgres');
require('dotenv').config();

const fastify = Fastify({
  logger: true
});

// Register plugins
fastify.register(fastifyCors, {
  origin: true
});

fastify.register(fastifyPostgres, {
  connectionString: process.env.DATABASE_URL || 'postgresql://user:password@localhost:5432/agentsocial'
});

fastify.register(fastifyJwt, {
  secret: process.env.JWT_SECRET || 'super-secret-key-change-in-production'
});

// Declare a route
fastify.get('/', async (request, reply) => {
  return { hello: 'AgentSocial API' }
});

// Register routes
const agentRoutes = require('./routes/agent.js');
const socialRoutes = require('./routes/social.js');
const messageRoutes = require('./routes/message.js');

fastify.register(agentRoutes, { prefix: '/api/agents' });
fastify.register(socialRoutes, { prefix: '/api/social' });
fastify.register(messageRoutes, { prefix: '/api/messages' });

// Run the server
const start = async () => {
  try {
    await fastify.listen({ port: process.env.PORT || 3002, host: '0.0.0.0' });
    fastify.log.info(`Server listening on ${fastify.server.address().port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();