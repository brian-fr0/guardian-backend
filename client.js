const { readFile } = require("node:fs/promises");
require("@tensorflow/tfjs-node");
const use = require("@tensorflow-models/universal-sentence-encoder");
const MLR = require("ml-regression-multivariate-linear"); // Default import, not destructured
const http = require("node:http");

async function loadModel() {
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

	return `Priority score: ${priorityScore < 0 ? 0 : (Math.round(priorityScore * 100) / 100) * 100}`;
}

(async () => {
	console.log("Loading Model");
	const regression = await loadModel();
	const model = await use.load();
	console.log("Model Loaded");

	http
		.createServer(async (req, res) => {
			let body = "";

			req.on("readable", () => {
				const chunk = req.read();
				if (chunk !== null) {
					body += chunk;
				}
			});

			if (req.url === "/") {
				switch (req.method) {
					case "GET":
						{
							res.setHeader("Content-Type", "text/html");
							const document = await readFile("./client.html", "utf8");
							res.end(document);
						}
						return;
					case "POST":
						{
							req.on("end", async () => {
								if (req.headers["content-type"] === "application/json") {
									body = JSON.parse(body);
								}
								const prediction = await predict(
									model,
									regression,
									body.message,
								);

								res.setHeader("Content-Type", "text/plain");
								res.statusCode = 200;
								res.write(prediction);
								res.end();
							});
						}
						return;
					default:
						break;
				}
			}

			res.statusCode = 404;
			res.end();
		})
		.listen(3000, () => {
			console.log("Server listening @ http://localhost:3000");
		});
})();
