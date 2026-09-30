import { describe, expect, it } from "vitest";
import {
  ensureFictionalMvpAccess,
  type DemoAccessDatabase,
} from "../../apps/server/src/demo-access.js";
import {
  hashCredential,
  verifyCredential,
} from "../../apps/server/src/identity.js";

describe("fictional MVP demo access", () => {
  it("changes only a mismatched demo credential and then remains stable", async () => {
    let credentialHash = await hashCredential("654321");
    let updates = 0;
    const database = {
      async query(text: string, values?: unknown[]) {
        if (text.includes("SELECT i.id"))
          return {
            command: "SELECT",
            rowCount: 1,
            oid: 0,
            fields: [],
            rows: [{ id: "demo-student", credential_hash: credentialHash }],
          };
        updates += 1;
        expect(values?.[0]).toBe("demo-student");
        credentialHash = String(values?.[1]);
        return {
          command: "UPDATE",
          rowCount: 1,
          oid: 0,
          fields: [],
          rows: [],
        };
      },
    } as DemoAccessDatabase;

    await expect(ensureFictionalMvpAccess(database)).resolves.toBe(true);
    expect(updates).toBe(1);
    await expect(verifyCredential("123456", credentialHash)).resolves.toBe(true);

    await expect(ensureFictionalMvpAccess(database)).resolves.toBe(true);
    expect(updates).toBe(1);
  });
});
