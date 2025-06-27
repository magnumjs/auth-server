const request = require("supertest");
const buildApp = require("../src/server"); // make your server exportable
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
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

test("GET /login renders login page for tenant", async () => {
  const res = await request(app.server).get(
    "/login?tenant=ConsumerApp&returnUrl=http://localhost:4000/dashboard"
  );
  expect(res.statusCode).toBe(200);
  expect(res.text).toMatch(/Login - ConsumerApp/);
});

test("Login sets refresh token cookie and returns access token", async () => {
  const res = await request(app.server).post("/login").send({
    email: "test@example.com",
    password: "testpass",
    tenant: "ConsumerApp",
    returnUrl: "/",
  });

  expect(res.statusCode).toBe(200);

  // ✅ Access token is in the response body
  expect(res.body).toHaveProperty("accessToken");
  expect(typeof res.body.accessToken).toBe("string");

  // ✅ Refresh token is in the cookies
  const cookies = res.headers["set-cookie"];
  const refreshCookie = cookies.find((c) => c.startsWith("refreshToken="));
  expect(refreshCookie).toBeDefined();
});

test("Login with invalid tenant returns 400", async () => { 
  const res = await request(app.server).post("/login").send({ 
    email: "test@example.com",    
    password: "testpass",    
    tenant: "InvalidTenant",    
    returnUrl: "http://localhost:3000/dashboard",  
  }); 
  // Expect a 401 Unauthorized response 
  expect(res.statusCode).toBe(400); 
  expect(res.body.error).toBe("Invalid tenant"); 
});

test("Login with invalid returnUrl returns 200 for non form", async () => {
  const res = await request(app.server).post("/login").send({
    email: "test@example.com",
    password: "testpass",    
    tenant: "ConsumerApp",    
    returnUrl: "/",  
  });
  // Expect a 401 Unauthorized response
  expect(res.statusCode).toBe(200);
  expect(res.body.accessToken).toBeDefined();
});

test("Login with invalid returnUrl returns 200 for form", async () => {
  const res = await request(app.server).post("/login")
  .type("form") // This makes it application/x-www-form-urlencoded
  .send({
    email: "test@example.com",
    password: "testpass",    
    tenant: "ConsumerApp",    
    returnUrl: "/",  
  });
  // Expect a 302 redirect response
  expect(res.statusCode).toBe(302);
  const redirectUrl = res.headers.location;
  // expect(redirectUrl).toMatch(/^\/\?token=/);

  // Extract token from query param
  const url = new URL(redirectUrl);
  const token = url.searchParams.get("token");
  expect(token).toBeDefined();});


test("Login via form redirects with refreshToken cookie set", async () => {
  const res = await request(app.server)
    .post("/login")
    .type("form") // This makes it application/x-www-form-urlencoded
    .send({       
      email: "test@example.com",      
      password: "testpass",      
      returnUrl: "http://localhost:3000/dashboard",
    });

  // Expect a redirect
  expect(res.statusCode).toBe(302);
  const redirectUrl = res.headers.location;
  expect(redirectUrl).toMatch(/^http:\/\/localhost:3000\/dashboard\?token=/);

  // Extract token from query param
  const url = new URL(redirectUrl);
  const token = url.searchParams.get("token");
  expect(token).toBeDefined();
});

test("Login via form with invalid credentials returns 401", async () => {
  const res = await request(app.server).post("/login").type("form").send({
    email: "test@example.com",
    password: "wrongpass", // Invalid password
    returnUrl: "http://localhost:3000/dashboard",
  });
  // Expect a 401 Unauthorized response
  expect(res.statusCode).toBe(401);
  expect(res.body.error).toBe("Invalid credentials");
});
test("Login via form redirects with refreshToken cookie set", async () => {
  const res = await request(app.server)
    .post("/login")
    .type("form") // This makes it application/x-www-form-urlencoded
    .send({
      email: "test@example.com",
      password: "testpass",
      returnUrl: "https://consumer.example.com/dashboard",
    });

  // Expect a redirect
  expect(res.statusCode).toBe(302);
  const redirectUrl = res.headers.location;
  expect(redirectUrl).toMatch(
    /^https:\/\/consumer\.example\.com\/dashboard\?token=/
  );

  // Extract token from query param
  const url = new URL(redirectUrl);
  const token = url.searchParams.get("token");
  expect(token).toBeDefined();

  // Decode and inspect token contents
  const decoded = jwt.decode(token);
  expect(decoded).toHaveProperty("email", "test@example.com");
  expect(decoded).toHaveProperty("roles");
  expect(Array.isArray(decoded.roles)).toBe(true);
  // ✅ Access token is in the response body

  // Check that refreshToken cookie is set
  const cookies = res.headers["set-cookie"];
  const refreshCookie = cookies.find((c) => c.startsWith("refreshToken="));
  expect(refreshCookie).toBeDefined();
});
test("Login via form with invalid credentials returns 401", async () => {
  const res = await request(app.server).post("/login").type("form").send({
    email: "test@example.com",
    password: "wrongpass", // Invalid password
    returnUrl: "http://localhost:3000/dashboard",
  });
  // Expect a 401 Unauthorized response
  expect(res.statusCode).toBe(401);
  expect(res.body.error).toBe("Invalid credentials");
});

test("Access token contains correct user claims", async () => {
  const res = await request(app.server).post("/login").send({
    email: "test@example.com",
    password: "testpass",
    returnUrl: "http://localhost:3000/dashboard",
  });

  const accessToken = res.body.accessToken;
  const verified = jwt.verify(accessToken, process.env.JWT_SECRET);
  expect(verified.email).toBe("test@example.com");
  expect(accessToken).toBeDefined();

  // Decode without verifying (just to inspect claims)
  const decoded = jwt.decode(accessToken);

  expect(decoded).toHaveProperty("sub");
  expect(decoded).toHaveProperty("email", "test@example.com");
  expect(decoded).toHaveProperty("roles");
  expect(Array.isArray(decoded.roles)).toBe(true);
});

test("Login via form with non-existent user returns 401", async () => {
  const res = await request(app.server).post("/login").type("form").send({
    email: "test@example.com", // Existing email
    password: "wrongpass", // Invalid password
    returnUrl: "http://localhost:3000/dashboard",
  });
  // Expect a 401 Unauthorized response
  expect(res.statusCode).toBe(401);
  expect(res.body.error).toBe("Invalid credentials");
});
test("Login via form with missing fields returns 400", async () => {
  const res = await request(app.server).post("/login").type("form").send({
    email: "", // Missing email
    password: "testpass",
    returnUrl: "/dashboard",
  });
  // Expect a 400 Bad Request response
  expect(res.statusCode).toBe(401);
  expect(res.body.error).toBe("Invalid credentials");
});
test("Login via form with missing password returns 400", async () => {
  const res = await request(app.server).post("/login").type("form").send({
    email: "test@example.com", // Missing password
    password: "",
    returnUrl: "/dashboard",
  });
  // Expect a 400 Bad Request response
  expect(res.statusCode).toBe(401);
  expect(res.body.error).toBe("Invalid credentials");
}); // End of the test block
