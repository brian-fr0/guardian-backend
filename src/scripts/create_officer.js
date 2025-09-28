const readline = require("node:readline");
const { promisify } = require("node:util");
const UserModel = require("src/models/user.model");
const z = require("zod");

const CreateOfficerSchema = z
  .tuple([z.string(), z.string(), z.string().min(8), z.email()])
  .transform(([firstName, lastName, password, email]) => ({
    first_name: firstName,
    last_name: lastName,
    password,
    email,
  }));

function getUserInput() {
  try {
    return CreateOfficerSchema.parse(
      process.argv.slice(2, process.argv.length),
    );
  } catch (e) {
    if (e instanceof z.ZodError) {
      console.error(e._zod.def[0]);
      throw new Error("Input Validation Error");
    }
  }
}

async function getUserTerminalInput() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const question = promisify(rl.question).bind(rl);

  const firstName = await question("Enter First Name: ");
  const lastName = await question("Enter Last Name: ");
  const password = await question("Enter Password: ");
  const email = await question("Enter Email: ");
  process.argv = [...process.argv, firstName, lastName, password, email];
  rl.close();
}

function generateUsername() {
  const num = Math.floor(Math.random() * 999);
  return `ID-${num.toString().padStart(3, "0")}`;
}

async function createOfficer() {
  if (process.argv.length === 2) {
    await getUserTerminalInput();
  }
  const userInput = getUserInput();
  const user = await new UserModel(
    generateUsername(),
    userInput.email,
    userInput.password,
    1,
  ).save();
  console.table(user);
  return user;
}

if (process.env.NODE_ENV !== "test") {
  createOfficer();
}

module.exports = {
  getUserInput,
  getUserTerminalInput,
  generateUsername,
  createOfficer,
};
