const cookieOptions = {
  httpOnly: true,
  path: "/",
  domain: "localhost",
  secure: false,
  sameSite: "lax",
  maxAge: 1000 * 60 * 60 * 24 * 7,
};

module.exports = cookieOptions;
