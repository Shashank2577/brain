import { createServer } from "node:http";
import { FluidOs, createOsClient } from "../../src/index.js";
import { notesApp } from "../apps/notes/manifest.js";
import { tasksApp } from "../apps/tasks/manifest.js";
import { mailApp } from "../apps/mail/manifest.js";
import { calendarApp } from "../apps/calendar/manifest.js";
import { contentApp } from "../apps/content/manifest.js";
import { slidesApp } from "../apps/slides/manifest.js";
import { dispatchApp } from "../apps/dispatch/manifest.js";

const PORT = Number(process.env.FLUID_OS_PORT ?? 4100);
const SECRET = process.env.FLUID_OS_SECRET ?? "dev-secret-must-be-at-least-32-bytes-long!!";

async function main() {
  const os = new FluidOs({ secret: SECRET });
  os.install(notesApp);
  os.install(tasksApp);
  os.install(mailApp);
  os.install(calendarApp);
  os.install(contentApp);
  os.install(slidesApp);
  os.install(dispatchApp);

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

function clientFor(osUrl: string, os: FluidOs, appId: string, user: { id: string; email: string; name?: string }) {
  return createOsClient({
    osUrl,
    appId,
    getToken: () => os.issueSession(user, { appId: os.osAppId }),
  });
}

async function demo(osUrl: string, os: FluidOs) {
  const alice = { id: "u_alice", email: "alice@example.com", name: "Alice" };
  const bob = { id: "u_bob", email: "bob@example.com", name: "Bob" };

  const dispatch = clientFor(osUrl, os, "dispatch", alice);
  const content = clientFor(osUrl, os, "content", alice);
  const slides = clientFor(osUrl, os, "slides", alice);
  const calendar = clientFor(osUrl, os, "calendar", alice);
  const mail = clientFor(osUrl, os, "mail", bob);

  console.log("\n========== cross-app demo ==========\n");

  console.log("[apps]");
  for (const a of await dispatch.listApps()) console.log(`  - ${a.id.padEnd(10)} ${a.name}`);

  console.log("\n[capabilities]");
  for (const c of await dispatch.listCapabilities()) console.log(`  - ${c.id.padEnd(36)} ${c.description}`);

  console.log("\n[1] dispatch.broadcast → fans out to mail.send-email (3 recipients)");
  const broadcast = await dispatch.call("dispatch.broadcast", {
    recipients: ["bob@example.com", "carol@example.com", "dave@example.com"],
    subject: "Beta launch on Monday",
    body: "We're shipping the OS to the beta cohort. Reply if you can attend the kickoff.",
  });
  console.log("    →", broadcast);

  console.log("\n[2] Bob (a different user) checks his inbox via mail.list-inbox");
  const bobInbox = await mail.call("mail.list-inbox", { limit: 5 });
  console.log("    →", bobInbox);

  console.log("\n[3] content.create-document → seed for slides");
  const doc = (await content.call("content.create-document", {
    title: "Beta launch plan",
    body:
      "Goals\nWin 5 beta logos.\nGet feedback on capability registry shape.\n\nRisks\nRPC latency on cold function starts.\nCapability namespace collisions.\n\nNext steps\nShip launcher UI.\nRetrofit mail + calendar.\nWrite migration guide.",
  })) as { id: string; title: string };
  console.log("    →", doc);

  console.log("\n[4] slides.create-deck-from-document → reads via content.get-document");
  const deck = await slides.call("slides.create-deck-from-document", { documentId: doc.id, maxSlides: 6 });
  console.log("    →", deck);

  console.log("\n[5] dispatch.send-and-schedule → calls mail.find-contact + calendar.check-availability + mail.send-email + calendar.create-event");
  const now = Date.now();
  const tomorrow10 = now + 24 * 60 * 60 * 1000;
  const tomorrow11 = tomorrow10 + 60 * 60 * 1000;
  const orchestrated = await dispatch.call("dispatch.send-and-schedule", {
    contactName: "Carol",
    subject: "Quick beta sync",
    body: "Got 30 min tomorrow to walk through what's working?",
    followUp: { startsAt: tomorrow10, endsAt: tomorrow11 },
  });
  console.log("    →", orchestrated);

  console.log("\n[6] calendar.list-events shows the booked follow-up");
  console.log("    →", await calendar.call("calendar.list-events", {}));

  console.log("\n[7] dispatch.send-and-schedule again at the same slot → calendar.check-availability rejects it");
  try {
    await dispatch.call("dispatch.send-and-schedule", {
      contactName: "Dave",
      subject: "Conflicting sync",
      body: "Same slot — should fail",
      followUp: { startsAt: tomorrow10, endsAt: tomorrow11 },
    });
    console.log("    → UNEXPECTED success");
  } catch (err) {
    console.log("    → rejected:", (err as Error).message);
  }

  console.log("\n====================================\n");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
