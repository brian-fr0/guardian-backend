module.exports = () => {
  return (
    process.env.NODE_ENV === "development" ||
    process.env.NODE_ENV === "DEVELOPMENT"
  );
};
