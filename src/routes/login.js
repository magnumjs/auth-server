const bcrypt = require("bcrypt");

const JWT_SECRET = process.env.JWT_SECRET || "supersecret";
const COOKIE_NAME = "auth_token";

module.exports = async function (app) {
  app.get("/login", async (req, reply) => {
    // const data = {
    //   title: "Login",
    //   returnUrl: req.query.returnUrl || "/",
    //   error: null,
    // };
    // return reply.view("login", data);

    const { tenant = "ConsumerApp", returnUrl } = req.query;
    const tenantInfo = await app.prisma.tenant.findUnique({
      where: { name: tenant },
    });
    if (!tenantInfo) return reply.code(400).send("Invalid tenant");
    return reply.view("login.ejs", { tenant, returnUrl, error: null });
  });

  // POST /login
  app.post("/login", async (request, reply) => {
    const {
      email,
      password,
      tenant = "ConsumerApp",
      returnUrl = request,
    } = request.body;

    const tenantInfo = await app.prisma.tenant.findUnique({
      where: { name: tenant },
    });
    if (!tenantInfo) return reply.code(400).send({ error: "Invalid tenant" });

    const user = await app.prisma.user.findFirst({
      where: {
        email,
        tenantId: tenantInfo.id,
      },
    });
console.log(password, user?.password)
    if (!user || !password || !user?.password ||
       !(await bcrypt.compare(password, user.password))) {
      return reply.code(401).send({ error: "Invalid credentials" });
    }

    const isFormRequest = request.headers["content-type"]?.includes(
      "application/x-www-form-urlencoded"
    );

    // generate token, set cookies, redirect, etc.
    const accessToken = app.jwt.sign(
      {
        sub: user.id,
        email: user.email,
        roles: user.roles,
      },
      { expiresIn: "15m" }
    );

    const refreshToken = app.jwt.sign(
      { sub: user.id, type: "refresh" },
      { expiresIn: "7d" }
    );

    const cookieOptions = {
      httpOnly: true,
      path: "/",
      sameSite: "Lax",
      secure: process.env.NODE_ENV === "production",
    };
    if (isFormRequest) {
      let redirectUrl;
      // verify if returnUrl is a relative path or a full URL
      // If returnUrl is a full URL, use it directly

      try {
        redirectUrl = new URL(returnUrl);
      } catch (e) {
        redirectUrl = new URL(`https://${request.host}` + returnUrl);
      }
      redirectUrl.searchParams.set("token", accessToken);
      // Form-based login (e.g. from federated login UI)
      return reply
        .setCookie("refreshToken", refreshToken, cookieOptions)
        .redirect(redirectUrl.toString());
    } else {
      // API/JSON login (e.g. frontend SPA or E2E test)
      return reply
        .setCookie("refreshToken", refreshToken, cookieOptions)
        .send({ accessToken });
    }
  });
};
