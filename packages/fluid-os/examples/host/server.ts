import { createServer } from "node:http";
import { FluidOs, createOsClient } from "../../src/index.js";
import { notesApp } from "../apps/notes/manifest.js";
import { tasksApp } from "../apps/tasks/manifest.js";
import { mailApp } from "../apps/mail/manifest.js";
import { calendarApp } from "../apps/calendar/manifest.js";
import { contentApp } from "../apps/content/manifest.js";
import { slidesApp } from "../apps/slides/manifest.js";
import { dispatchApp } from "../apps/dispatch/manifest.js";
import { crmApp } from "../apps/crm/manifest.js";
import { meetingsApp } from "../apps/meetings/manifest.js";

const PORT = Number(process.env.FLUID_OS_PORT ?? 4100);
const SECRET = process.env.FLUID_OS_SECRET ?? "dev-secret-must-be-at-least-32-bytes-long!!";
const PUBLIC_URL = process.env.FLUID_OS_PUBLIC_URL ?? `http://localhost:${PORT}`;
const RUN_DEMO = process.env.FLUID_OS_DEMO !== "0";

async function main() {
  const os = new FluidOs({
    secret: SECRET,
    allowDevSignin: true,
    github:
      process.env.FLUID_OS_GITHUB_CLIENT_ID && process.env.FLUID_OS_GITHUB_CLIENT_SECRET
        ? {
            clientId: process.env.FLUID_OS_GITHUB_CLIENT_ID,
            clientSecret: process.env.FLUID_OS_GITHUB_CLIENT_SECRET,
            callbackUrl: `${PUBLIC_URL}/_fluid-os/auth/github/callback`,
          }
        : undefined,
  });

  os.install(notesApp);
  os.install(tasksApp);
  os.install(mailApp);
  os.install(calendarApp);
  os.install(contentApp);
  os.install(slidesApp);
  os.install(dispatchApp);
  os.install(crmApp);
  os.install(meetingsApp);

  const server = createServer(async (req, res) => {
    const url = new URL(req.url ?? "/", PUBLIC_URL);
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
    const buf = Buffer.from(await response.arrayBuffer());
    res.end(buf);
  });

  await new Promise<void>((r) => server.listen(PORT, r));
  console.log(`\nFluid OS running at ${PUBLIC_URL}`);
  console.log(`  Shell:           ${PUBLIC_URL}/`);
  console.log(`  Installed apps:  ${os.registry.listApps().map((a) => a.id).join(", ")}`);
  console.log(`  Capabilities:    ${os.registry.listCapabilities().length}`);

  if (RUN_DEMO) {
    await crossAppDemo(PUBLIC_URL, os);
    server.close();
  } else {
    console.log(`\n(Demo skipped — server staying up. Open ${PUBLIC_URL}/ in a browser.)`);
  }
}

function clientFor(osUrl: string, os: FluidOs, appId: string, user: { id: string; email: string; name?: string }) {
  return createOsClient({
    osUrl,
    appId,
    getToken: () => os.issueSession(user, { appId: os.osAppId }),
  });
}

async function crossAppDemo(osUrl: string, os: FluidOs) {
  const alice = { id: "u_alice", email: "alice@example.com", name: "Alice" };

  const crm = clientFor(osUrl, os, "crm", alice);
  const meetings = clientFor(osUrl, os, "meetings", alice);
  const calendar = clientFor(osUrl, os, "calendar", alice);
  const content = clientFor(osUrl, os, "content", alice);

  console.log("\n========== cross-app demo ==========\n");

  console.log("[CRM] create a contact + deal");
  const contact = (await crm.call("crm.create-contact", {
    name: "Carol Chen",
    email: "carol@example.com",
    company: "Acme",
  })) as { id: string };
  await crm.call("crm.create-deal", { contactId: contact.id, title: "Acme — Pro plan", amount: 12000 });

  console.log("[CRM → mail] log outreach (crm.log-outreach calls mail.send-email)");
  const outreach = await crm.call("crm.log-outreach", {
    contactId: contact.id,
    subject: "Pro plan — next steps",
    body: "Hi Carol, sharing a one-pager and a couple of timeslots for a quick review.",
  });
  console.log("    →", outreach);

  console.log("[CRM → calendar] schedule meeting (crm.schedule-meeting calls calendar.create-event)");
  const now = Date.now();
  const meet = await crm.call("crm.schedule-meeting", {
    contactId: contact.id,
    title: "Carol × Alice — Pro plan",
    startsAt: now + 60 * 60 * 1000,
    endsAt: now + 90 * 60 * 1000,
  });
  console.log("    →", meet);

  console.log("[Meetings] upload a recording");
  const rec = (await meetings.call("meetings.upload-recording", {
    source: { kind: "s3", ref: "s3://fluid-demo/recordings/carol-sync.mp4" },
    durationSec: 28 * 60,
  })) as { id: string };
  console.log("    →", rec);

  console.log("[Meetings] process-recording → transcribe + extract → content.create-document + tasks.create + link to calendar");
  const processed = await meetings.call("meetings.process-recording", {
    recordingId: rec.id,
    linkToCalendarWithinMinutes: 240,
  });
  console.log("    →", processed);

  console.log("\n[content] the document the meeting created:");
  console.log("    →", await content.call("content.list-documents", {}));
  console.log("\n[calendar] events on the user's calendar:");
  console.log("    →", await calendar.call("calendar.list-events", {}));
  console.log("\n[CRM] activity log on Carol:");
  console.log("    →", await crm.call("crm.list-activity", { contactId: contact.id }));

  console.log("\n====================================");
  console.log("Open " + osUrl + "/ in a browser to drive any of these capabilities from the shell UI.\n");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
