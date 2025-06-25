const Fastify = require("fastify");
const view = require("@fastify/view");
const dotenv = require("dotenv");
const ejs = require("ejs");
const path = require("path");
const jwtPlugin = require("./plugins/jwt");
const prismaPlugin = require("./plugins/prisma");
const oauthPlugin = require("./plugins/oauth");
const loginRoutes = require("./routes/login");
const refreshRoutes = require("./routes/refresh");
const formBody = require("@fastify/formbody");
const fastifyCookie = require("@fastify/cookie");

async function buildApp() {
  const envFilepath = process.env.NODE_ENV === "test" ? ".env.test" : ".env";

  dotenv.config({ path: envFilepath });

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
  app.register(prismaPlugin);
  app.register(oauthPlugin);
  app.register(loginRoutes);
  app.register(refreshRoutes);

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
