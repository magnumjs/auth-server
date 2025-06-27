const fp = require("fastify-plugin");
const fastifySwagger = require("@fastify/swagger");
const fastifySwaggerUI = require("@fastify/swagger-ui");

module.exports = fp(async function (fastify) {
  fastify.register(fastifySwagger, {
    openapi: {
      info: {
        title: "Federated Login API",
        description: "JWT-based federated login service",
        version: "1.0.0",
      },
      servers: [{ url: "http://localhost:3000" }],
    },
  });

  fastify.register(fastifySwaggerUI, {
    routePrefix: "/docs",
    uiConfig: {
      docExpansion: "list",
      deepLinking: false,
    },
  });
});
