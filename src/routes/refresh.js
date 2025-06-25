module.exports = async function (app) {
  app.post("/refresh", async (request, reply) => {
    const { refreshToken } = request.cookies;

    if (!refreshToken) {
      return reply.code(401).send({ error: "Missing refresh token" });
    }

    try {
      const payload = app.jwt.verify(refreshToken);

      if (payload.type !== "refresh") {
        throw new Error("Invalid token type");
      }

      const user = await app.prisma.user.findUnique({ where: { id: payload.sub } });
      if (!user) {
        return reply.code(401).send({ error: "User not found" });
      }

      const newAccessToken = app.jwt.sign(
        { sub: user.id, email: user.email, roles: user.roles },
        { expiresIn: "15m" }
      );

      return reply.send({ accessToken: newAccessToken });
    } catch (err) {
      return reply.code(401).send({ error: "Invalid or expired token" });
    }
  });
};
