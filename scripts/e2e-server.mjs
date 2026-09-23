import { mkdtemp, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { spawn } from "node:child_process";
import { createServer } from "node:http";

// Each browser suite gets a new fictional store; never reset any existing file.
const directory = await mkdtemp("/tmp/pvf-browser-test-");
const storePath = join(directory, "fictional-development.json");
const control = createServer(async (request, response) => {
  if (request.method !== "POST" || request.url !== "/__reset") {
    response.writeHead(404).end();
    return;
  }
  // Only this process's newly created disposable fixture file can be reset.
  await writeFile(storePath, JSON.stringify({ attempts: [] }));
  response.writeHead(204).end();
});
await new Promise((resolve) => control.listen(3102, "127.0.0.1", resolve));
const child = spawn("npm", ["run", "dev"], {
  stdio: "inherit",
  env: {
    ...process.env,
    PVF_DATA_PATH: storePath,
    PORT: "3101",
    PVF_WEB_PORT: "5181",
    PVF_API_PORT: "3101",
    PVF_MODE: "development",
    PVF_AUTH: "",
    DATABASE_URL: "",
  },
});
const stop = () => {
  control.close();
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
