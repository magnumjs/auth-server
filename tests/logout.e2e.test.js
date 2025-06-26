const request = require("supertest");
const buildApp = require("../src/server"); // make your server exportable
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");

const prisma = new PrismaClient();

let app;
let password;

beforeAll(async () => {
  password = await bcrypt.hash("testpass", 10);

  await prisma.user.upsert({
    where: { email: "test@example.com" },
    update: {},
    create: {
      email: "test@example.com",
      password,
      roles: ["USER"],
    },
  });

  console.log("✅ Seeded test user");

  app = await buildApp();
  await app.ready(); // Wait for Fastify to be ready
});

afterAll(async () => {
  await app.close();
});

test('Logout clears refresh token cookie', async () => {
  // Step 1: Login to get the refresh cookie
  const loginRes = await request(app.server)
    .post('/login')
    .type('form')
    .send({
      email: 'test@example.com',
      password: 'testpass',
      returnUrl: '/',
    });

  const refreshCookie = loginRes.headers['set-cookie'].find((c) =>
    c.startsWith('refreshToken=')
  );
  expect(refreshCookie).toBeDefined();

  // Step 2: Logout and expect Set-Cookie with Max-Age=0
  const logoutRes = await request(app.server)
    .post('/logout')
    .set('Cookie', refreshCookie);

    const cleared = logoutRes.headers['set-cookie'].find((c) =>
    c.startsWith('refreshToken=') && c.includes('Expires=Thu, 01 Jan 1970 00:00:00 GMT')
  );

  expect(logoutRes.statusCode).toBe(200);
  expect(cleared).toBeDefined();
});
