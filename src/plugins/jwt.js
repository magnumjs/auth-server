const fp = require("fastify-plugin");
const fastifyJwt = require("@fastify/jwt");

module.exports = fp(async function (fastify) {
  fastify.register(fastifyJwt, {
    secret: process.env.JWT_SECRET || "super-secret",
    cookie: {
      cookieName: "refreshToken",
      signed: false,
    },
  });

  fastify.decorate("authenticate", async function (request, reply) {
    try {
      const decoded = await request.jwtVerify();
      request.user = decoded;
    } catch (err) {
      reply.send(err);
    }
  });
});
