const crypto = require("crypto");

const KEY = Buffer.from(process.env.DATA_KEY_BASE64 || "", "base64");
if (KEY.length !== 32) {
  throw new Error("DATA_KEY_BASE64 must be a 32-byte key in base64");
}

function encrypt(plain) {
  if (plain == null) return null;
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", KEY, iv);
  const enc = Buffer.concat([cipher.update(String(plain), "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, enc]).toString("base64");
}

function decrypt(b64) {
  if (!b64) return null;
  const buf = Buffer.from(b64, "base64");
  const iv = buf.slice(0, 12);
  const tag = buf.slice(12, 28);
  const enc = buf.slice(28);
  const decipher = crypto.createDecipheriv("aes-256-gcm", KEY, iv);
  decipher.setAuthTag(tag);
  const out = Buffer.concat([decipher.update(enc), decipher.final()]);
  return out.toString("utf8");
}

module.exports = { encrypt, decrypt };
