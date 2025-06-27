const Fastify = require("fastify");
const view = require("@fastify/view");
const dotenv = require("dotenv");
const ejs = require("ejs");
const path = require("path");
const jwtPlugin = require("./plugins/jwt");
const prismaPlugin = require("./plugins/prisma");
const oauthPlugin = require("./plugins/oauth");
const swaggerPlugin = require("./plugins/swagger");
const loginRoutes = require("./routes/login");
const refreshRoutes = require("./routes/refresh");
const meRoutes = require("./routes/me");
const logoutRoutes = require("./routes/logout");
const formBody = require("@fastify/formbody");
const fastifyCookie = require("@fastify/cookie");

async function buildApp() {
  const envFilepath = process.env.NODE_ENV === "test" ? ".env.test" : ".env";

  dotenv.config({ path: envFilepath });

  const JWT_SECRET = process.env.JWT_SECRET || "super-secret";
  const COOKIE_NAME = "auth_token";

  const app = Fastify({
    // logger: true, // Enable detailed logs
  });

  app.register(formBody);

  await app.register(fastifyCookie, {
    secret: process.env.COOKIE_SECRET || "super-secret", // for signed cookies if needed
  });

  app.register(view, {
    engine: { ejs },
    root: path.join(__dirname, "views"),
  });


  app.register(jwtPlugin);
  app.register(swaggerPlugin);
  app.register(prismaPlugin);
  app.register(oauthPlugin);
  app.register(loginRoutes);
  app.register(refreshRoutes);
  app.register(meRoutes);
  app.register(logoutRoutes);

  return app;
}

if (require.main === module) {
  buildApp().then((app) => {
    app.listen({ port: 3000, host: "0.0.0.0" }, (err, address) => {
      if (err) {
        app.log.error(err);
        process.exit(1);
      }
      console.log(`Server listening at ${address}`);
    });
  });
}

module.exports = buildApp;
