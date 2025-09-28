class CriticalError extends Error {}

const INTERNAL_UNAUTHORIZED_STATE = new CriticalError(
  "Authorization guard failed: no user identity found for protected route.",
);

module.exports = {
  CriticalError,
  INTERNAL_UNAUTHORIZED_STATE,
};
