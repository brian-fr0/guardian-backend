const { readFile, writeFile } = require("node:fs/promises");
require("@tensorflow/tfjs-node");
const use = require("@tensorflow-models/universal-sentence-encoder");
const MLR = require("ml-regression-multivariate-linear");
const { join } = require("node:path");

(async () => {
  const trainingData = JSON.parse(
    (
      await readFile(join(process.cwd(), "training-data.json"), "utf8")
    ).toString(),
  );

  const texts = trainingData.map((item) => item.text);
  const priorities = trainingData.map((item) => item.priority);

  const model = await use.load();
  const embeddings = await model.embed(texts);
  const embeddingArray = await embeddings.array();
  embeddings.dispose();

  const priorities2D = priorities.map((p) => [p]);

  console.log("Creating MLR with shapes:");
  console.log("X:", embeddingArray.length, "x", embeddingArray[0].length);
  console.log("Y:", priorities2D.length, "x", priorities2D[0].length);

  const regression = new MLR(embeddingArray, priorities2D);

  await writeFile(
    join(process.cwd(), "trained-model.json"),
    JSON.stringify(regression.toJSON()),
  );
})().catch(console.error);
