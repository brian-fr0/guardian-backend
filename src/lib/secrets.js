// src/lib/secrets.js
const env = process.env;

async function getSecret(key) {
  // In production, if a secret manager is configured, fetch from there.
  if (process.env.VAULT_ADDR && process.env.VAULT_TOKEN) {
    // Example Vault client (pseudo-code):
    // const vault = require("node-vault")({ endpoint: process.env.VAULT_ADDR, token: process.env.VAULT_TOKEN });
    // const data = await vault.read(`secret/data/${key}`);
    // return data.data[key];
  }

  if (process.env.AWS_REGION) {
    // Example AWS Secrets Manager (pseudo-code):
    // const { SecretsManagerClient, GetSecretValueCommand } = require("@aws-sdk/client-secrets-manager");
    // const client = new SecretsManagerClient({ region: process.env.AWS_REGION });
    // const data = await client.send(new GetSecretValueCommand({ SecretId: key }));
    // return JSON.parse(data.SecretString)[key];
  }

  // Default: use .env values
  return env[key];
}

module.exports = { getSecret };
