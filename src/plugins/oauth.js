const fp = require('fastify-plugin');

module.exports = fp(async function (fastify) {
  fastify.get('/auth/google', async (req, reply) => {
    // Normally redirect to Google's OAuth consent screen
    reply.redirect('/auth/google/callback?token=mock-token');
  });

  fastify.get('/auth/google/callback', async (req, reply) => {
    // In real life, you'd verify token & fetch profile from Google
    const fakeGoogleUser = {
      email: 'googleuser@example.com',
      roles: ['USER']
    };

    // Create/find user
    let user = await fastify.prisma.user.findUnique({ where: { email: fakeGoogleUser.email } });
    if (!user) {
      user = await fastify.prisma.user.create({
        data: {
          email: fakeGoogleUser.email,
          password: null,
          roles: fakeGoogleUser.roles
        }
      });
    }

    const token = fastify.jwt.sign({ sub: user.id, roles: user.roles });
    reply.setCookie('refreshToken', token, { path: '/', httpOnly: true });
    return reply.send({ accessToken: token });
  });
});