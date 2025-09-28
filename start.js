require("dotenv").config();
process.env.NODE_PATH = process.env.NODE_PATH || ".";
require("node:module").Module._initPaths();
require("./src/server");
