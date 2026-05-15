# Creating new apps for Fluid OS

When the user asks Claude (or any agent / dev) to create a new app — e.g.
**"add a CRM to my workspace"** or **"build a Granola-like meeting recorder
that creates tasks from action items"** — the new app must not reinvent
what other apps already do. The Fluid OS contract makes that explicit:
every app declares what capabilities it **exposes** and what other apps'
capabilities it **consumes**.

The flow below is what Claude should follow every time.

## Step 1 — Read the registry, do not guess

Before writing any code, list the installed apps and their capabilities.
This is the same data the agent's tool catalog is built from.

**As a human:**

```bash
pnpm --filter @agent-native/fluid-os create-app print-registry
```

**Programmatically (in an action, in a script):**

```ts
import { createOsClient } from "@agent-native/fluid-os/rpc/client";

const client = createOsClient({ osUrl, appId: "shell", getToken });
const apps = await client.listApps();
const capabilities = await client.listCapabilities();
```

The registry is the **only** source of truth. Don't assume `mail` has
`send`; check that it has `mail.send-email`. Don't assume `calendar` lets
you check availability; verify `calendar.check-availability` is there.

## Step 2 — Decide what to reuse, what to add

Walk the registry output with the user. For each piece of behavior the
new app needs, answer:

1. **Is it already there?** If yes, declare it under `consumes` and call
   it via `ctx.call(...)`. Don't reimplement.
2. **Is it almost there?** Open the existing app's manifest, add the
   missing variant there, and call _that_. One owner per capability.
3. **Is it genuinely new?** Add it as a capability on the new app.

The four rules of thumb:

- **One canonical writer per resource.** Only `mail` writes email. Only
  `calendar` writes events. Only `content` writes documents. New apps
  call those — they don't shadow them with their own tables.
- **Cross-app capabilities are tagged `cross-app`** so it's easy to see
  which capabilities exist mostly to compose other apps.
- **Capabilities that delegate AI to a model** must go through the agent
  chat per `delegate-to-agent`. Stub-first is fine; mark them with the
  `ai-stub` tag and replace later. See `meetings.transcribe` for the
  pattern.
- **Identity is the OS user, always.** Apps never carry their own login
  UI; they trust the OS-signed token and use `ctx.user.email` / `ctx.user.id`.

## Step 3 — Scaffold the manifest

Once the `consumes` list and the new capabilities are clear:

```bash
pnpm --filter @agent-native/fluid-os create-app meetings \
  --description "Upload a meeting recording, get tasks + notes." \
  --consumes "calendar.list-events,content.create-document,tasks.create" \
  --capability "upload-recording:Register a recording from S3 or upload." \
  --capability "transcribe:Transcribe a recording (AI)." \
  --capability "process-recording:End-to-end pipeline that calls content + tasks + calendar."
```

The scaffolder prints the registry first (Step 1 baked in), then writes
`examples/apps/meetings/manifest.ts` with:

- `consumes` validated against the real capability list (warns if any id
  is unknown).
- Stub handlers that throw `Not implemented yet`.
- Comments pointing at `ctx.user`, `ctx.caller.appId`, and `ctx.call(...)`.

## Step 4 — Implement handlers

Each handler is a normal async function. Inside it you have:

- `ctx.user` — the OS-verified user (id, email, name, optional `github` block).
- `ctx.caller.appId` — which app made the call. Use it for per-caller
  policy if you need it.
- `ctx.call(fqid, input)` — call another capability. The same registry
  resolves it; the same user identity flows through.

A canonical cross-app handler looks like this (`crm.log-outreach`):

```ts
handler: async (input, ctx) => {
  const contact = contacts.get(input.contactId);
  if (!contact || contact.ownerId !== ctx.user.id) throw new Error("contact not found");

  const sent = (await ctx.call("mail.send-email", {
    to: contact.email,
    subject: input.subject,
    body: input.body,
  })) as { id: string };

  activities.set(act.id, {
    id: act.id,
    contactId: contact.id,
    kind: "email",
    summary: input.subject,
    ref: { messageId: sent.id },
    ownerId: ctx.user.id,
    at: Date.now(),
  });

  return { activityId: act.id, messageId: sent.id };
},
```

## Step 5 — Install on the OS

Drop one line into the host's startup:

```ts
import { meetingsApp } from "./apps/meetings/manifest.ts";
os.install(meetingsApp);
```

The shell sidebar now lists the new app, the registry exposes its
capabilities, and other apps can declare `consumes: ["meetings.process-recording"]`
to call into it.

## The Claude interactive flow (summary)

When the user says "create a CRM that talks to mail and calendar":

1. **Claude lists the registry** (`pnpm create-app print-registry`) and
   confirms with the user: "`mail.send-email`, `mail.find-contact`,
   `calendar.create-event`, `calendar.check-availability` already exist
   — the CRM will consume those rather than reimplement them."
2. **Claude proposes the new capabilities**: `crm.create-contact`,
   `crm.list-contacts`, `crm.create-deal`, `crm.log-outreach` (which
   calls `mail.send-email`), `crm.schedule-meeting` (which calls
   `calendar.create-event`).
3. **The user agrees**; Claude runs the scaffolder.
4. **Claude implements the handlers**, using `ctx.call(...)` for the
   cross-app pieces.
5. **One `os.install(crmApp)` line** is added to the host. The CRM is now
   on the OS sidebar; other apps can add `crm.list-contacts` to their
   `consumes`; the agent's tool catalog grows by the new capabilities
   automatically.

That's the whole loop. The registry is the contract; everything else is
plumbing.
