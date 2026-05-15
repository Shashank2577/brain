import { useEffect, useMemo, useState } from "react";
import {
  IconArrowLeft,
  IconArrowRight,
  IconCheck,
  IconPlus,
  IconSparkles,
  IconTrash,
} from "@tabler/icons-react";
import { Dialog } from "./components/ui/dialog";
import { Button } from "./components/ui/button";
import { Input, Textarea } from "./components/ui/input";
import { Badge } from "./components/ui/badge";
import { fetchCapabilities, scaffoldApp, suggestConsumes, type SuggestedCapability } from "./api";
import type { CapabilityEntry } from "./types";

type Step = "describe" | "consumes" | "capabilities" | "review";

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated: (appId: string) => void;
}

interface NewCap {
  id: string;
  description: string;
}

export function CreateAppWizard({ open, onClose, onCreated }: Props) {
  const [step, setStep] = useState<Step>("describe");
  const [id, setId] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const [allCaps, setAllCaps] = useState<CapabilityEntry[]>([]);
  const [suggestions, setSuggestions] = useState<SuggestedCapability[]>([]);
  const [loadingSuggest, setLoadingSuggest] = useState(false);
  const [consumes, setConsumes] = useState<Set<string>>(new Set());

  const [caps, setCaps] = useState<NewCap[]>([]);
  const [newCapId, setNewCapId] = useState("");
  const [newCapDesc, setNewCapDesc] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) fetchCapabilities().then(setAllCaps).catch(() => undefined);
  }, [open]);

  useEffect(() => {
    if (!open) reset();
  }, [open]);

  function reset() {
    setStep("describe");
    setId("");
    setName("");
    setDescription("");
    setSuggestions([]);
    setConsumes(new Set());
    setCaps([]);
    setNewCapId("");
    setNewCapDesc("");
    setError(null);
    setSubmitting(false);
  }

  async function loadSuggestions() {
    setLoadingSuggest(true);
    try {
      const s = await suggestConsumes(description);
      setSuggestions(s);
    } catch {
      setSuggestions([]);
    } finally {
      setLoadingSuggest(false);
    }
  }

  const canGoNext = useMemo(() => {
    if (step === "describe") return /^[a-z][a-z0-9-]*$/.test(id) && name.trim().length > 0 && description.trim().length > 0;
    if (step === "capabilities") return caps.length > 0;
    return true;
  }, [step, id, name, description, caps.length]);

  async function submit() {
    setError(null);
    setSubmitting(true);
    try {
      const result = await scaffoldApp({
        id,
        name,
        description,
        consumes: Array.from(consumes),
        capabilities: caps,
      });
      onCreated(result.app.id);
      onClose();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Create a new app"
      description="The OS will scaffold the manifest, hot-install it on this running OS, and add it to the sidebar."
      size="lg"
      footer={
        <>
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          {step !== "describe" && (
            <Button variant="outline" size="sm" onClick={() => setStep(prevStep(step))}>
              <IconArrowLeft size={14} />
              Back
            </Button>
          )}
          {step !== "review" ? (
            <Button
              size="sm"
              disabled={!canGoNext}
              onClick={() => {
                if (step === "describe") loadSuggestions();
                setStep(nextStep(step));
              }}
            >
              Next
              <IconArrowRight size={14} />
            </Button>
          ) : (
            <Button size="sm" disabled={submitting} onClick={submit}>
              <IconCheck size={14} />
              {submitting ? "Creating…" : "Create & install"}
            </Button>
          )}
        </>
      }
    >
      <StepIndicator step={step} />

      {step === "describe" && (
        <div className="flex flex-col gap-4">
          <Field label="App id" hint="Lower-kebab. This becomes the prefix for every capability, e.g. crm.*">
            <Input
              value={id}
              onChange={(e) => {
                setId(e.target.value);
                if (!name) setName(toTitle(e.target.value));
              }}
              placeholder="crm"
              spellCheck={false}
            />
          </Field>
          <Field label="Display name">
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="CRM" />
          </Field>
          <Field label="Description" hint="Plain-English. The wizard uses this to suggest which existing capabilities to reuse.">
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Contacts, deals, and activity history. Sends outreach emails and books follow-up meetings."
            />
          </Field>
        </div>
      )}

      {step === "consumes" && (
        <div className="flex flex-col gap-3">
          <p className="text-xs text-muted-foreground">
            Apps already on this OS. Check the capabilities your new app will call. <strong>Don't reimplement what's
            already here</strong> — call it via <code className="font-mono">ctx.call(...)</code> instead.
          </p>

          {loadingSuggest ? (
            <p className="text-xs text-muted-foreground">Reading the registry…</p>
          ) : suggestions.length > 0 ? (
            <div>
              <SectionLabel icon={<IconSparkles size={12} />}>Suggested from your description</SectionLabel>
              <CapList caps={suggestions.map((s) => ({ id: s.id, description: s.description, appId: s.appId }))} selected={consumes} onToggle={toggle(consumes, setConsumes)} />
            </div>
          ) : null}

          <div>
            <SectionLabel>All installed capabilities</SectionLabel>
            <CapList
              caps={allCaps.filter((c) => !suggestions.some((s) => s.id === c.id))}
              selected={consumes}
              onToggle={toggle(consumes, setConsumes)}
            />
          </div>
        </div>
      )}

      {step === "capabilities" && (
        <div className="flex flex-col gap-4">
          <p className="text-xs text-muted-foreground">
            What new capabilities does <code className="font-mono">{id}</code> expose? Use lower-kebab ids; the OS exposes
            them as <code className="font-mono">{id}.&lt;id&gt;</code>.
          </p>

          <div className="flex flex-col gap-2">
            {caps.map((c, i) => (
              <div key={i} className="flex items-start gap-2 p-3 border border-border rounded-md bg-secondary/30">
                <div className="flex-1 min-w-0">
                  <div className="font-mono text-xs font-semibold">
                    {id}.{c.id}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">{c.description}</div>
                </div>
                <Button size="icon" variant="ghost" onClick={() => setCaps(caps.filter((_, j) => j !== i))}>
                  <IconTrash size={14} />
                </Button>
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-2 p-3 border border-dashed border-border rounded-md">
            <Input
              value={newCapId}
              onChange={(e) => setNewCapId(e.target.value)}
              placeholder="capability-id (e.g. create-contact)"
            />
            <Textarea
              value={newCapDesc}
              onChange={(e) => setNewCapDesc(e.target.value)}
              placeholder="One-sentence description of what this capability does."
            />
            <Button
              size="sm"
              variant="outline"
              disabled={!/^[a-z][a-z0-9-]*$/.test(newCapId) || newCapDesc.trim() === ""}
              onClick={() => {
                setCaps([...caps, { id: newCapId.trim(), description: newCapDesc.trim() }]);
                setNewCapId("");
                setNewCapDesc("");
              }}
            >
              <IconPlus size={14} />
              Add capability
            </Button>
          </div>
        </div>
      )}

      {step === "review" && (
        <div className="flex flex-col gap-4">
          <ReviewLine label="App">
            <span className="font-mono text-xs">{id}</span> — <span>{name}</span>
          </ReviewLine>
          <ReviewLine label="Description">
            <span className="text-xs text-muted-foreground">{description}</span>
          </ReviewLine>
          <ReviewLine label="Consumes">
            {consumes.size === 0 ? (
              <span className="text-xs text-muted-foreground">(none)</span>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {Array.from(consumes).map((c) => (
                  <code key={c} className="rounded bg-secondary px-2 py-1 font-mono text-[11px]">
                    {c}
                  </code>
                ))}
              </div>
            )}
          </ReviewLine>
          <ReviewLine label="Exposes">
            <div className="flex flex-col gap-1">
              {caps.map((c) => (
                <div key={c.id} className="flex items-start gap-2 text-xs">
                  <code className="font-mono">
                    {id}.{c.id}
                  </code>
                  <span className="text-muted-foreground">— {c.description}</span>
                </div>
              ))}
            </div>
          </ReviewLine>
          {error && (
            <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
              {error}
            </div>
          )}
          <p className="text-[11px] text-muted-foreground">
            Clicking <strong>Create &amp; install</strong> writes the manifest to <code className="font-mono">examples/apps/{id || "<id>"}/manifest.ts</code>,
            hot-loads it, and registers it on this running OS. Handlers will throw <code className="font-mono">Not implemented yet</code> until you fill them in — the cross-app and skill wiring is live immediately.
          </p>
        </div>
      )}
    </Dialog>
  );
}

function nextStep(s: Step): Step {
  return s === "describe" ? "consumes" : s === "consumes" ? "capabilities" : "review";
}
function prevStep(s: Step): Step {
  return s === "review" ? "capabilities" : s === "capabilities" ? "consumes" : "describe";
}

function StepIndicator({ step }: { step: Step }) {
  const steps: { id: Step; label: string }[] = [
    { id: "describe", label: "Describe" },
    { id: "consumes", label: "Discover" },
    { id: "capabilities", label: "Expose" },
    { id: "review", label: "Review" },
  ];
  const active = steps.findIndex((s) => s.id === step);
  return (
    <div className="flex items-center gap-1.5 mb-5">
      {steps.map((s, i) => (
        <div key={s.id} className="flex items-center gap-1.5">
          <Badge
            className={
              i <= active
                ? "bg-primary text-primary-foreground border-transparent"
                : "bg-secondary text-muted-foreground"
            }
          >
            {i + 1} · {s.label}
          </Badge>
          {i < steps.length - 1 && <span className="text-muted-foreground/40">→</span>}
        </div>
      ))}
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-medium">{label}</span>
      {children}
      {hint && <span className="text-[11px] text-muted-foreground">{hint}</span>}
    </label>
  );
}

function SectionLabel({ icon, children }: { icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">
      {icon}
      {children}
    </div>
  );
}

function toggle<T>(set: Set<T>, setter: (s: Set<T>) => void) {
  return (v: T) => {
    const next = new Set(set);
    if (next.has(v)) next.delete(v);
    else next.add(v);
    setter(next);
  };
}

function CapList({
  caps,
  selected,
  onToggle,
}: {
  caps: { id: string; description: string; appId: string }[];
  selected: Set<string>;
  onToggle: (id: string) => void;
}) {
  if (caps.length === 0) return <p className="text-xs text-muted-foreground">(none)</p>;
  return (
    <div className="flex flex-col gap-1">
      {caps.map((c) => (
        <button
          key={c.id}
          onClick={() => onToggle(c.id)}
          className={`flex items-start gap-2 p-2.5 rounded-md border text-left transition-colors ${
            selected.has(c.id) ? "border-primary bg-secondary/50" : "border-border hover:border-ring/50"
          }`}
        >
          <span
            className={`mt-0.5 inline-flex h-4 w-4 items-center justify-center rounded border ${
              selected.has(c.id) ? "border-primary bg-primary text-primary-foreground" : "border-border"
            }`}
          >
            {selected.has(c.id) && <IconCheck size={10} />}
          </span>
          <div className="min-w-0 flex-1">
            <div className="font-mono text-xs font-semibold">{c.id}</div>
            <div className="text-[11px] text-muted-foreground">{c.description}</div>
          </div>
        </button>
      ))}
    </div>
  );
}

function ReviewLine({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-1">{label}</div>
      <div>{children}</div>
    </div>
  );
}

function toTitle(s: string) {
  return s
    .split("-")
    .map((p) => p[0]?.toUpperCase() + p.slice(1))
    .join(" ");
}
