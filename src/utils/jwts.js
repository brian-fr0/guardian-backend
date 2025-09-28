/**
 * @param {import('express').Request} req
 * @param {('access'|'refresh'|'all')} type
 * @returns {{access: string|null, refresh: string|null}}
 */
function getJwtFromRequest(req, type) {
  const tokens = tryGetTokensFromCookie(req, type);
  return tokens !== null
    ? tokens
    : tryGetTokensFromAuthorisationHeader(req, type);
}

/**
 * @param {import('express').Request} req
 * @param {('access'|'refresh'|'all')} type
 * @returns {{access: string|null, refresh: string|null}}
 */
function tryGetTokensFromCookie(req, type) {
  const accessToken = req.cookies.accessToken;
  const refreshToken = req.cookies.refreshToken;

  switch (type) {
    case "access":
      if (!accessToken) return null;
      return { access: accessToken, refresh: null };
    case "refresh":
      if (!refreshToken) return null;
      return { access: null, refresh: refreshToken };
    case "all":
      if (!accessToken && !refreshToken) return null;
      return { access: accessToken, refresh: refreshToken };
    default:
      return null;
  }
}

/**
 * @param {import('express').Request} req
 * @param {('access'|'refresh'|'all')} type
 * @returns {{access: string|null, refresh: string|null}}
 */
function tryGetTokensFromAuthorisationHeader(req, type) {
  const refresh = req.headers["refresh-token"] || null;
  if (type === "refresh") {
    return { access: null, refresh };
  }

  let access = null;
  const accessTokenHeader = req.headers.authorization;
  if (accessTokenHeader?.startsWith("Bearer ")) {
    access = accessTokenHeader.substring(7);
  }

  if (type === "access") {
    return { access, refresh: null };
  }

  return { access, refresh };
}

module.exports = getJwtFromRequest;
