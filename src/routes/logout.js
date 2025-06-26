module.exports = async function (app) {
  const fastify = app;

  fastify.post("/logout", async (request, reply) => {
    reply
      .clearCookie("refreshToken", {
        path: "/",
        httpOnly: true,
        maxAge: 0, // Clear the cookie immediately
        sameSite: "Lax",
        secure: process.env.NODE_ENV === "production",
      })
      .send({ success: true });
  });
};
