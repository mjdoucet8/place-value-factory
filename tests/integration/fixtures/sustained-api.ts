import { Pool } from "pg";
import { createApiServer } from "../../../apps/server/src/index.js";

const socket = process.env.PVF_TEST_PG_SOCKET;
const schema = process.env.PVF_TEST_SCHEMA;
const receiptKey = process.env.PVF_TEST_RECEIPT_KEY;
if (!socket?.startsWith("/tmp/pvf-postgres-test-") ||
    !/^sustained_[0-9a-f]{32}$/.test(schema ?? "") ||
    !/^[0-9a-f]{64}$/.test(receiptKey ?? ""))
  throw new Error("Disposable sustained-load fixture configuration required.");

const pool = new Pool({ host: socket, database: "postgres", max: 15, options: `-c search_path=${schema}` });
const server = createApiServer("/unused/sustained.json", {
  database: pool,
  identity: { origin: "https://classroom.test", receiptKey: receiptKey! },
});
server.listen(0, "127.0.0.1", () => {
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("Fixture listener missing.");
  process.stdout.write(`SUSTAINED_PORT ${address.port}\n`);
});
process.on("SIGTERM", () => {
  server.close(() => { void pool.end().finally(() => process.exit(0)); });
});
