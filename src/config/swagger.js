const yaml = require("yamljs");
const swaggerUi = require("swagger-ui-express");
const isDevelopmentMode = require("src/utils/is-development-mode");

const swaggerDocument = yaml.load("docs/openapi.yaml");

function registerSwaggerForDevEnv(app) {
  if (isDevelopmentMode()) {
    app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
  }
}

module.exports = registerSwaggerForDevEnv;
