const { readFile } = require("node:fs/promises");
require("@tensorflow/tfjs-node");
const use = require("@tensorflow-models/universal-sentence-encoder");
const MLR = require("ml-regression-multivariate-linear");

async function loadRegression() {
  const modelData = JSON.parse(await readFile("./trained-model.json", "utf8"));

  const regression = MLR.load(modelData);

  return regression;
}

async function predict(model, regression, text) {
  const embedding = await model.embed([text]);
  const embeddingArray = await embedding.array();
  embedding.dispose();

  const prediction = regression.predict(embeddingArray);
  const priorityScore = prediction[0][0];

  return priorityScore;
}

let regression = null;
let model = null;

/**
 * @param {string} text
 * @returns {number}
 */
async function getTextPriority(text) {
  if (!regression || !model) {
    regression = await loadRegression();
    model = await use.load();
  }

  return await predict(model, regression, text);
}

module.exports = {
  getTextPriority,
};
