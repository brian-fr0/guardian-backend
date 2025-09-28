const REDACTION = "[redacted]";

// Common patterns to redact (extend later if needed)
const EMAIL_RE = /\b[\w.%+-]+@[\w.-]+\.[A-Za-z]{2,}\b/g;
const PHONE_RE = /\b(?:\+?\d{1,3}[-.\s]?)?(?:\d{2,4}[-.\s]?){2,4}\d{2,4}\b/g;
// Sri Lanka NIC formats: old (9 digits + V/X) and new (12 digits)
const NIC_OLD_RE = /\b\d{9}[VvXx]\b/g;
const NIC_NEW_RE = /\b\d{12}\b/g;

function scrubPII(text) {
  if (typeof text !== "string") return text;
  return text
    .replace(EMAIL_RE, REDACTION)
    .replace(NIC_OLD_RE, REDACTION)
    .replace(NIC_NEW_RE, REDACTION)
    .replace(PHONE_RE, REDACTION)
    .replace(/\+\s*\[redacted\]/g, REDACTION);
}

// Express middleware: scrubs req.body.text before hitting Dialogflow (no logging)
function scrubChatInput(req, _res, next) {
  if (req?.body && typeof req.body.text === "string") {
    req.body.text = scrubPII(req.body.text);
  }
  next();
}

module.exports = { scrubChatInput };
