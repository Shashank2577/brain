import { createServer } from "node:http";
import { FluidOs, createOsClient } from "../../src/index.js";
import { notesApp } from "../apps/notes/manifest.js";
import { tasksApp } from "../apps/tasks/manifest.js";

const PORT = Number(process.env.FLUID_OS_PORT ?? 4100);
const SECRET = process.env.FLUID_OS_SECRET ?? "dev-secret-must-be-at-least-32-bytes-long!!";

async function main() {
  const os = new FluidOs({ secret: SECRET });
  os.install(notesApp);
  os.install(tasksApp);

  const server = createServer(async (req, res) => {
    const url = new URL(req.url ?? "/", `http://localhost:${PORT}`);
    const chunks: Buffer[] = [];
    for await (const c of req) chunks.push(c as Buffer);
    const body = chunks.length ? Buffer.concat(chunks).toString("utf8") : undefined;

    const headers = new Headers();
    for (const [k, v] of Object.entries(req.headers)) {
      if (typeof v === "string") headers.set(k, v);
      else if (Array.isArray(v)) headers.set(k, v.join(","));
    }

    const request = new Request(url, {
      method: req.method,
      headers,
      body: body && req.method !== "GET" && req.method !== "HEAD" ? body : undefined,
    });

    const response = await os.handle(request);
    res.statusCode = response.status;
    response.headers.forEach((v, k) => res.setHeader(k, v));
    const text = await response.text();
    res.end(text);
  });

  await new Promise<void>((r) => server.listen(PORT, r));
  console.log(`Fluid OS running at http://localhost:${PORT}`);
  console.log(os.registry.describeForAgent());

  await demo(`http://localhost:${PORT}`, os);
  server.close();
}

async function demo(osUrl: string, os: FluidOs) {
  const user = { id: "u_alice", email: "alice@example.com", name: "Alice" };
  const tasksToken = await os.issueSession(user, { appId: os.osAppId });
  const notesToken = await os.issueSession(user, { appId: os.osAppId });

  const tasksClient = createOsClient({
    osUrl,
    appId: "tasks",
    getToken: () => tasksToken,
  });
  const notesClient = createOsClient({
    osUrl,
    appId: "notes",
    getToken: () => notesToken,
  });

  console.log("\n--- Demo flow ---");

  console.log("apps:", (await tasksClient.listApps()).map((a) => a.id));
  console.log("capabilities:", (await tasksClient.listCapabilities()).map((c) => c.id));

  const task = await tasksClient.call("tasks.create", { text: "ship the OS", alsoNote: true });
  console.log("tasks.create →", task);

  const notes = await notesClient.call("notes.list", {});
  console.log("notes.list →", notes);

  const matches = await notesClient.call("notes.search", { q: "ship" });
  console.log("notes.search('ship') →", matches);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
