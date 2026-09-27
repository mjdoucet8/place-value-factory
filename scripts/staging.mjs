import { spawn, spawnSync } from "node:child_process";

const run = (args) => {
  const result = spawnSync("npm", args, { stdio: "inherit", env: process.env });
  if (result.error || result.status !== 0)
    throw new Error(`npm ${args.join(" ")} failed`);
};

run(["run", "db:migrate", "--workspace=@place-value-factory/server"]);
run(["run", "staging:seed"]);
const server = spawn("npm", ["run", "start:staging"], {
  stdio: "inherit",
  env: process.env,
});
for (const signal of ["SIGINT", "SIGTERM"])
  process.once(signal, () => server.kill(signal));
server.once("exit", (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  else process.exit(code ?? 1);
});
