const request = require("supertest");
const buildApp = require("../src/server"); // make your server exportable
const { PrismaClient } = require("@prisma/client");
const main = require("../prisma/seed"); // Ensure this file seeds the database

const prisma = new PrismaClient();

let app;

beforeAll(async () => {
  await main().finally(() => prisma.$disconnect());

  console.log("✅ Seeded test user");

  app = await buildApp();
  await app.ready(); // Wait for Fastify to be ready
});

afterAll(async () => {
  await app.close();
});

test("GET /me returns current user info from accessToken", async () => {
  const loginRes = await request(app.server).post("/login").send({
    email: "test@example.com",
    password: "testpass",
    returnUrl: "/",
  });

  const { accessToken } = loginRes.body;

  const meRes = await request(app.server)
    .get("/me")
    .set("Authorization", `Bearer ${accessToken}`);

  expect(meRes.statusCode).toBe(200);
  expect(meRes.body.user).toHaveProperty("email", "test@example.com");
  expect(meRes.body.user).toHaveProperty("roles");
});
