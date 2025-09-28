require("dotenv").config();
const { all, run } = require("../config/database");
const { encrypt } = require("../lib/crypto");

const ENC_PREFIX = "enc:v1:";
const isEnc = (v) => typeof v === "string" && v.startsWith(ENC_PREFIX);
const encVal = (v) => (v == null || v === "" ? null : ENC_PREFIX + encrypt(String(v)));

(async () => {
  const rows = await all(`
    SELECT id, first_name, last_name, date_of_birth, contact_number
      FROM personal_details
  `);

  for (const r of rows) {
    const first_name     = isEnc(r.first_name)     ? r.first_name     : encVal(r.first_name);
    const last_name      = isEnc(r.last_name)      ? r.last_name      : encVal(r.last_name);
    const date_of_birth  = isEnc(r.date_of_birth)  ? r.date_of_birth  : encVal(r.date_of_birth);
    const contact_number = isEnc(r.contact_number) ? r.contact_number : encVal(r.contact_number);

    await run(
      `UPDATE personal_details
          SET first_name = ?, last_name = ?, date_of_birth = ?, contact_number = ?
        WHERE id = ?`,
      [first_name, last_name, date_of_birth, contact_number, r.id]
    );
  }

  console.log("Backfill complete.");
  process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });
