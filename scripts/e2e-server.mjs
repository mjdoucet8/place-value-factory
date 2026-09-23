import { mkdtemp } from "node:fs/promises";
import { join } from "node:path";
import { spawn } from "node:child_process";

// Each browser suite gets a new fictional store; never reset any existing file.
const directory = await mkdtemp("/tmp/pvf-browser-test-");
const child = spawn("npm", ["run", "dev"], {
  stdio: "inherit",
  env: {
    ...process.env,
    PVF_DATA_PATH: join(directory, "fictional-development.json"),
    PORT: "3101",
    PVF_WEB_PORT: "5181",
    PVF_API_PORT: "3101",
    PVF_MODE: "development",
    PVF_AUTH: "",
    DATABASE_URL: "",
  },
});
const stop = () => {
  try {
    child.kill("SIGTERM");
  } catch (error) {
    if (error.code !== "ESRCH") throw error;
  }
};
process.once("SIGINT", stop);
process.once("SIGTERM", stop);
child.once("exit", (code) => {
  process.exitCode = code ?? 0;
});
