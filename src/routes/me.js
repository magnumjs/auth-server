module.exports = async function (app) {
  const fastify = app;
  const prisma = fastify.prisma;

  fastify.get(
    "/me",
    { preValidation: [fastify.authenticate] },
    async (request, reply) => {
      const user = await prisma.user.findUnique({
        where: { id: request.user.sub },
        select: {
          id: true,
          email: true,
          roles: true,
        },
      });

      if (!user) {
        return reply.code(404).send({ error: "User not found" });
      }

      return { user };
    }
  );
};
