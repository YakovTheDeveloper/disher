import "dotenv/config";
import pg from "pg";
import { grant, getBalance } from "../src/billing/wallet.js";

// One-off dev helper: credit every user's prepaid wallet. LOCAL only — never
// runs against a remote DB. Reuses the tested grant() ledger path.
const AMOUNT_KOP = 50000; // 500 ₽

const url = process.env.LOCAL_DATABASE_URL;
if (!url) throw new Error("LOCAL_DATABASE_URL not set");
if (process.env.REMOTE_DATABASE_URL) {
  throw new Error("REMOTE_DATABASE_URL is set — refusing to run against remote");
}

const pool = new pg.Pool({ connectionString: url });
const users = await pool.query<{ id: string; email: string }>(
  `select id, email from users order by "createdAt" asc`,
);
await pool.end();

console.log(`crediting ${users.rows.length} users +${AMOUNT_KOP / 100} ₽ each\n`);
for (const u of users.rows) {
  const before = await getBalance(u.id);
  const { balanceKop } = await grant(u.id, AMOUNT_KOP, "dev bulk top-up");
  console.log(
    `${u.email.padEnd(32)} ${(before / 100).toFixed(2).padStart(8)} → ${(balanceKop / 100).toFixed(2)} ₽`,
  );
}
process.exit(0);
