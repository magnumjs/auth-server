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

test('Can refresh access token using refreshToken cookie', async () => {
  // Step 1: Login and get the refreshToken cookie
  const loginRes = await request(app.server)
    .post('/login')
    .type('form')
    .send({
      email: 'test@example.com',
      password: 'testpass',
      returnUrl: '/',
    });

  const cookies = loginRes.headers['set-cookie'];
  const refreshCookie = cookies.find(c => c.startsWith('refreshToken='));

  expect(refreshCookie).toBeDefined();

  // Step 2: Hit /refresh with the cookie
  const refreshRes = await request(app.server)
    .post('/refresh')
    .set('Cookie', refreshCookie);

  expect(refreshRes.statusCode).toBe(200);
  expect(refreshRes.body).toHaveProperty('accessToken');

  // Step 3: Decode and verify new token
  const jwt = require('jsonwebtoken');
  const decoded = jwt.decode(refreshRes.body.accessToken);

  expect(decoded).toHaveProperty('sub');
  expect(decoded).toHaveProperty('email', 'test@example.com');
});
test('Returns 401 if refreshToken cookie is missing', async () => {
  const res = await request(app.server)
    .post('/refresh');

  expect(res.statusCode).toBe(401);
  expect(res.body).toHaveProperty('error', 'Missing refresh token');
});

test('Returns 401 if refreshToken is invalid', async () => {
  const res = await request(app.server)
    .post('/refresh')
    .set('Cookie', 'refreshToken=invalidtoken');  // Simulate invalid token     
  expect(res.statusCode).toBe(401);
  expect(res.body).toHaveProperty('error', 'Invalid or expired token');
});