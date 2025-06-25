const bcrypt = require("bcrypt");

module.exports = async function (app) {
  app.get("/login", async (req, reply) => {
    const data = {
      title: "Login",
      returnUrl: req.query.returnUrl || "/",
      error: null,
    };
    return reply.view("login", data);
  });

  // POST /login
  app.post("/login", async (request, reply) => {
    const { email, password, returnUrl = "/" } = request.body;

    const user = await app.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return reply.code(401).send({ error: "Invalid email" });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return reply.code(401).send({ error: "Invalid password" });
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
      // Form-based login (e.g. from federated login UI)
      reply
        .setCookie("refreshToken", refreshToken, cookieOptions)
        .redirect(returnUrl);
    } else {
      // API/JSON login (e.g. frontend SPA or E2E test)
      reply
        .setCookie("refreshToken", refreshToken, cookieOptions)
        .send({ accessToken });
    }
  });
};
