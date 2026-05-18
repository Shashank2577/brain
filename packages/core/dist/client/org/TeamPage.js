import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useMemo, useRef, useState } from "react";
import { IconBuilding, IconUserPlus, IconTrash, IconCrown, IconShieldCheck, IconLoader2, IconCheck, IconPencil, IconAt, IconX, IconKey, IconCopy, IconRefresh, IconEye, IconEyeOff, IconCloudUpload, IconFileImport, IconPlus, IconAlertTriangle, } from "@tabler/icons-react";
import { useOrg, useOrgMembers, useOrgInvitations, useCreateOrg, useUpdateOrg, useBulkInviteMembers, useChangeMemberRole, useAcceptInvitation, useRemoveMember, useSwitchOrg, useSetOrgDomain, useSetA2ASecret, useSyncA2ASecret, useJoinByDomain, } from "./hooks.js";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger, } from "../components/ui/tooltip.js";
function RoleIcon({ role }) {
    if (role === "owner")
        return _jsx(IconCrown, { className: "h-3.5 w-3.5 text-amber-500" });
    if (role === "admin")
        return _jsx(IconShieldCheck, { className: "h-3.5 w-3.5 text-blue-500" });
    return null;
}
function ErrorText({ error }) {
    if (!error)
        return null;
    return (_jsx("p", { className: "text-xs text-red-500", children: error instanceof Error ? error.message : String(error) }));
}
function PendingInvitationsCard() {
    const { data: org } = useOrg();
    const acceptInvitation = useAcceptInvitation();
    if (!org?.pendingInvitations?.length)
        return null;
    return (_jsxs("section", { className: "rounded-lg border border-border bg-card p-4 space-y-3", children: [_jsx("h3", { className: "text-sm font-medium", children: "Pending Invitations" }), org.pendingInvitations.map((inv) => (_jsxs("div", { className: "flex items-center justify-between rounded-md border border-border p-3", children: [_jsxs("div", { children: [_jsx("div", { className: "text-sm font-medium", children: inv.orgName }), _jsxs("div", { className: "text-xs text-muted-foreground", children: ["Invited by ", inv.invitedBy] })] }), _jsx("button", { type: "button", onClick: () => acceptInvitation.mutate(inv.id), disabled: acceptInvitation.isPending, className: "rounded-md bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50", children: acceptInvitation.isPending ? (_jsx(IconLoader2, { className: "h-3.5 w-3.5 animate-spin" })) : ("Accept") })] }, inv.id))), _jsx(ErrorText, { error: acceptInvitation.error })] }));
}
function JoinByDomainCard({ matches }) {
    const joinByDomain = useJoinByDomain();
    const [pendingId, setPendingId] = useState(null);
    return (_jsxs("section", { className: "rounded-lg border border-border bg-card p-4 space-y-3", children: [_jsx("h3", { className: "text-sm font-medium", children: "Join your team" }), _jsx("p", { className: "text-sm text-muted-foreground", children: matches.length === 1
                    ? `An organization matching your email domain already exists. Join it to collaborate with your teammates.`
                    : `Organizations matching your email domain already exist. Join one to collaborate with your teammates.` }), _jsx("div", { className: "space-y-2", children: matches.map((m) => (_jsxs("div", { className: "flex items-center justify-between rounded-md border border-border p-3", children: [_jsxs("div", { className: "flex items-center gap-2.5", children: [_jsx("div", { className: "flex h-8 w-8 items-center justify-center rounded-md bg-blue-600/10", children: _jsx(IconBuilding, { className: "h-4 w-4 text-blue-600" }) }), _jsx("div", { className: "text-sm font-medium", children: m.orgName })] }), _jsx("button", { type: "button", disabled: joinByDomain.isPending && pendingId === m.orgId, onClick: () => {
                                setPendingId(m.orgId);
                                joinByDomain.mutate(m.orgId, {
                                    onSettled: () => setPendingId(null),
                                });
                            }, className: "rounded-md bg-foreground px-3 py-1.5 text-xs font-medium text-background hover:opacity-90 disabled:opacity-50", children: joinByDomain.isPending && pendingId === m.orgId ? (_jsx(IconLoader2, { className: "h-3.5 w-3.5 animate-spin" })) : ("Join") })] }, m.orgId))) }), _jsx(ErrorText, { error: joinByDomain.error })] }));
}
function CreateOrgCard({ description }) {
    const createOrg = useCreateOrg();
    const [name, setName] = useState("");
    const [showForm, setShowForm] = useState(false);
    return (_jsxs("section", { className: "rounded-lg border border-border bg-card p-4 space-y-3", children: [_jsx("h3", { className: "text-sm font-medium", children: "Create an Organization" }), _jsx("p", { className: "text-sm text-muted-foreground", children: description || "Set up a team to collaborate with your colleagues." }), !showForm ? (_jsx("button", { type: "button", onClick: () => setShowForm(true), className: "rounded-md bg-foreground px-3 py-1.5 text-xs font-medium text-background hover:opacity-90", children: "Create organization" })) : (_jsxs("div", { className: "space-y-2", children: [_jsx("input", { type: "text", value: name, onChange: (e) => setName(e.target.value), placeholder: "e.g. Acme Inc.", className: "w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-foreground", autoFocus: true }), _jsxs("div", { className: "flex gap-2", children: [_jsx("button", { type: "button", disabled: !name.trim() || createOrg.isPending, onClick: () => createOrg.mutate(name.trim(), {
                                    onSuccess: () => {
                                        setName("");
                                        setShowForm(false);
                                    },
                                }), className: "rounded-md bg-foreground px-3 py-1.5 text-xs font-medium text-background hover:opacity-90 disabled:opacity-50", children: createOrg.isPending ? (_jsx(IconLoader2, { className: "h-3.5 w-3.5 animate-spin" })) : ("Create") }), _jsx("button", { type: "button", onClick: () => {
                                    setShowForm(false);
                                    setName("");
                                }, className: "rounded-md border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground", children: "Cancel" })] }), _jsx(ErrorText, { error: createOrg.error })] }))] }));
}
function OrgNameDisplay({ name, canEdit }) {
    const [editing, setEditing] = useState(false);
    const [draft, setDraft] = useState(name);
    const updateOrg = useUpdateOrg();
    if (!canEdit)
        return _jsx("div", { className: "text-sm font-medium", children: name });
    if (!editing) {
        return (_jsxs("button", { type: "button", onClick: () => {
                setDraft(name);
                setEditing(true);
            }, className: "group flex items-center gap-1.5 text-sm font-medium hover:text-foreground/80", children: [name, _jsx(IconPencil, { className: "h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100" })] }));
    }
    function save() {
        const trimmed = draft.trim();
        if (!trimmed || trimmed === name) {
            setEditing(false);
            return;
        }
        updateOrg.mutate(trimmed, { onSuccess: () => setEditing(false) });
    }
    return (_jsxs("div", { className: "flex items-center gap-1.5", children: [_jsx("input", { type: "text", value: draft, onChange: (e) => setDraft(e.target.value), onKeyDown: (e) => {
                    if (e.key === "Enter")
                        save();
                    if (e.key === "Escape")
                        setEditing(false);
                }, onBlur: save, className: "rounded border border-border bg-background px-1.5 py-0.5 text-sm font-medium focus:outline-none focus:ring-1 focus:ring-foreground", autoFocus: true }), _jsx(ErrorText, { error: updateOrg.error })] }));
}
function MembersCard() {
    const { data: org } = useOrg();
    const { data: membersData, isLoading: isLoadingMembers } = useOrgMembers();
    const { data: invitationsData } = useOrgInvitations();
    const removeMember = useRemoveMember();
    const switchOrg = useSwitchOrg();
    const [showInviteForm, setShowInviteForm] = useState(false);
    if (!org?.orgId)
        return null;
    const isOwner = org.role === "owner";
    const isOwnerOrAdmin = isOwner || org.role === "admin";
    const members = membersData?.members ?? [];
    const pendingInvites = invitationsData?.invitations ?? [];
    const hasMultipleOrgs = (org.orgs?.length ?? 0) > 1;
    return (_jsxs("section", { className: "rounded-lg border border-border bg-card p-4 space-y-4", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: "flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600/10", children: _jsx(IconBuilding, { className: "h-5 w-5 text-blue-600" }) }), _jsxs("div", { children: [_jsx(OrgNameDisplay, { name: org.orgName ?? "", canEdit: isOwnerOrAdmin }), _jsxs("div", { className: "text-xs text-muted-foreground", children: [members.length, " member", members.length !== 1 ? "s" : "", " \u00B7 You are", " ", org.role] })] })] }), hasMultipleOrgs && (_jsx("select", { value: org.orgId ?? "", onChange: (e) => switchOrg.mutate(e.target.value || null), disabled: switchOrg.isPending, className: "rounded-md border border-border bg-background px-2.5 py-1.5 text-xs", children: org.orgs.map((o) => (_jsx("option", { value: o.orgId, children: o.orgName }, o.orgId))) }))] }), _jsxs("div", { className: "border-t border-border pt-3 space-y-1", children: [_jsx("div", { className: "text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2", children: "Members" }), isLoadingMembers && members.length === 0 && (_jsx(_Fragment, { children: [0, 1, 2].map((i) => (_jsx("div", { className: "flex items-center justify-between py-1.5 px-2", children: _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("div", { className: "h-3.5 rounded bg-muted animate-pulse", style: { width: `${140 + i * 30}px` } }), _jsx("div", { className: "h-3.5 w-3.5 rounded bg-muted animate-pulse" })] }) }, i))) })), members.map((m) => (_jsx(MemberRow, { email: m.email, role: m.role, isCurrentUser: m.email === org.email, currentUserRole: org.role ?? null }, m.email))), pendingInvites.map((inv) => (_jsx("div", { className: "flex items-center justify-between py-1.5 px-2 opacity-60", children: _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: "text-sm", children: inv.email }), _jsx(RoleIcon, { role: inv.role }), _jsxs("span", { className: "rounded border border-border px-1.5 py-0.5 text-[10px] text-muted-foreground", children: ["Invited", inv.role === "admin" ? " · admin" : ""] })] }) }, inv.id)))] }), isOwnerOrAdmin && (_jsx("div", { className: "border-t border-border pt-3", children: !showInviteForm ? (_jsxs("button", { type: "button", onClick: () => setShowInviteForm(true), className: "flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs font-medium hover:bg-accent/50", children: [_jsx(IconUserPlus, { className: "h-3.5 w-3.5" }), "Invite members"] })) : (_jsx(BulkInviteForm, { currentUserRole: org.role, onClose: () => setShowInviteForm(false) })) })), isOwnerOrAdmin && (_jsx(DomainSettingsSection, { domain: org.allowedDomain, ownerEmail: org.email })), isOwner && _jsx(A2ASecretSection, { secret: org.a2aSecret }), _jsx(ErrorText, { error: removeMember.error }), _jsx(ErrorText, { error: switchOrg.error })] }));
}
function MemberRow({ email, role, isCurrentUser, currentUserRole, }) {
    const removeMember = useRemoveMember();
    const changeRole = useChangeMemberRole();
    const [editing, setEditing] = useState(false);
    const [confirmingRemove, setConfirmingRemove] = useState(false);
    // Owners can manage admins + members. Admins can only manage members.
    // Owners themselves are immutable through this UI; current user can't
    // edit their own role here.
    const canManage = role !== "owner" &&
        !isCurrentUser &&
        (currentUserRole === "owner" ||
            (currentUserRole === "admin" && role === "member"));
    return (_jsxs("div", { className: "flex items-center justify-between py-1.5 px-2 rounded hover:bg-accent/30", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: "text-sm", children: email }), _jsx(RoleIcon, { role: role }), isCurrentUser && (_jsx("span", { className: "rounded border border-border px-1.5 py-0.5 text-[10px] text-muted-foreground", children: "You" })), role === "admin" && (_jsx("span", { className: "rounded border border-border px-1.5 py-0.5 text-[10px] text-blue-600", children: "Admin" }))] }), canManage && (_jsxs("div", { className: "flex items-center gap-1", children: [editing ? (_jsxs("select", { autoFocus: true, value: role, onChange: (e) => {
                            const next = e.target.value === "admin" ? "admin" : "member";
                            if (next !== role) {
                                changeRole.mutate({ email, role: next }, { onSuccess: () => setEditing(false) });
                            }
                            else {
                                setEditing(false);
                            }
                        }, onBlur: () => setEditing(false), disabled: changeRole.isPending, className: "rounded-md border border-border bg-background px-1.5 py-0.5 text-[11px]", children: [_jsx("option", { value: "member", children: "Member" }), _jsx("option", { value: "admin", children: "Admin" })] })) : (_jsxs(Tooltip, { children: [_jsx(TooltipTrigger, { asChild: true, children: _jsx("button", { type: "button", onClick: () => setEditing(true), className: "text-muted-foreground hover:text-foreground", children: _jsx(IconPencil, { className: "h-3.5 w-3.5" }) }) }), _jsx(TooltipContent, { children: "Change role" })] })), confirmingRemove ? (_jsxs("div", { className: "flex items-center gap-1", children: [_jsx("button", { type: "button", onClick: () => setConfirmingRemove(false), className: "rounded px-1.5 py-0.5 text-[11px] text-muted-foreground hover:bg-accent hover:text-foreground", children: "Cancel" }), _jsx("button", { type: "button", disabled: removeMember.isPending, onClick: () => removeMember.mutate(email, {
                                    onSettled: () => setConfirmingRemove(false),
                                }), className: "rounded bg-red-500 px-1.5 py-0.5 text-[11px] text-white hover:bg-red-600 disabled:opacity-50", children: "Remove" })] })) : (_jsxs(Tooltip, { children: [_jsx(TooltipTrigger, { asChild: true, children: _jsx("button", { type: "button", disabled: removeMember.isPending, onClick: () => setConfirmingRemove(true), className: "text-muted-foreground hover:text-red-500 disabled:opacity-50", children: _jsx(IconTrash, { className: "h-3.5 w-3.5" }) }) }), _jsx(TooltipContent, { children: "Remove member" })] }))] }))] }));
}
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
function parseEmailList(input) {
    return Array.from(new Set(input
        .split(/[\s,;]+/)
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean)));
}
function parseCsvEmails(text) {
    // Tolerant CSV parse — split on lines, then on commas, take any cell
    // that looks like an email. Handles "name,email,role" rows or just
    // "email" per line. A robust full CSV parser would be overkill here.
    const cells = [];
    for (const line of text.split(/\r?\n/)) {
        for (const cell of line.split(",")) {
            const trimmed = cell.trim().replace(/^"|"$/g, "");
            if (trimmed)
                cells.push(trimmed);
        }
    }
    return Array.from(new Set(cells.filter((c) => EMAIL_RE.test(c)).map((c) => c.toLowerCase())));
}
function BulkInviteForm({ currentUserRole, onClose, }) {
    const bulkInvite = useBulkInviteMembers();
    const fileRef = useRef(null);
    const [drafts, setDrafts] = useState([
        { email: "", role: "member" },
    ]);
    const [pasteOpen, setPasteOpen] = useState(false);
    const [pasteValue, setPasteValue] = useState("");
    const [pasteRole, setPasteRole] = useState("member");
    const [resultBanner, setResultBanner] = useState(null);
    const canSetAdmin = currentUserRole === "owner";
    const validDrafts = useMemo(() => drafts
        .map((d) => ({ ...d, email: d.email.trim().toLowerCase() }))
        .filter((d) => EMAIL_RE.test(d.email)), [drafts]);
    function setDraft(index, patch) {
        setDrafts((prev) => prev.map((d, i) => (i === index ? { ...d, ...patch } : d)));
    }
    function appendEmails(emails, role) {
        if (!emails.length)
            return;
        setDrafts((prev) => {
            const existing = new Set(prev.map((d) => d.email.trim().toLowerCase()).filter(Boolean));
            const fresh = [];
            for (const e of emails) {
                if (!existing.has(e)) {
                    fresh.push({ email: e, role });
                    existing.add(e);
                }
            }
            // If the only existing row is an empty placeholder, drop it.
            const cleaned = prev.filter((d, i) => !(i === 0 && !d.email.trim() && prev.length === 1));
            return [...cleaned, ...fresh];
        });
    }
    function handleFile(file) {
        file.text().then((text) => {
            const emails = parseCsvEmails(text);
            if (emails.length) {
                appendEmails(emails, "member");
            }
            else {
                setResultBanner({
                    succeeded: 0,
                    failed: [{ email: file.name, error: "No valid emails found in CSV" }],
                });
            }
        });
    }
    async function submit() {
        setResultBanner(null);
        const dedup = new Map();
        for (const d of validDrafts) {
            // canSetAdmin guard mirrors server-side enforcement so an admin-only
            // user editing the form can't even attempt to grant admin (they'd
            // get a 403 anyway).
            const role = canSetAdmin ? d.role : "member";
            dedup.set(d.email, { ...d, role });
        }
        const invites = Array.from(dedup.values());
        if (invites.length === 0)
            return;
        const result = await bulkInvite.mutateAsync(invites);
        setResultBanner({
            succeeded: result.succeeded.length,
            failed: result.failed,
        });
        // Wipe drafts that succeeded; leave failed ones so the user can fix
        // and retry. If everything succeeded, reset to a single blank row.
        const failedEmails = new Set(result.failed.map((f) => f.email));
        setDrafts((prev) => {
            const remaining = prev.filter((d) => failedEmails.has(d.email.trim().toLowerCase()));
            return remaining.length > 0 ? remaining : [{ email: "", role: "member" }];
        });
        // Auto-close on full success.
        if (result.failed.length === 0 && result.succeeded.length > 0) {
            setTimeout(() => onClose(), 1200);
        }
    }
    return (_jsxs("div", { className: "space-y-3", children: [_jsx("div", { className: "space-y-2", children: drafts.map((draft, i) => (_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("input", { type: "email", value: draft.email, onChange: (e) => setDraft(i, { email: e.target.value }), placeholder: "colleague@company.com", className: "flex-1 rounded-md border border-border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-foreground", autoFocus: i === drafts.length - 1 }), _jsxs("select", { value: draft.role, onChange: (e) => setDraft(i, {
                                role: e.target.value === "admin" ? "admin" : "member",
                            }), disabled: !canSetAdmin, title: canSetAdmin
                                ? undefined
                                : "Only the organization owner can invite admins", className: "rounded-md border border-border bg-background px-2 py-1.5 text-xs disabled:opacity-50", children: [_jsx("option", { value: "member", children: "Member" }), _jsx("option", { value: "admin", children: "Admin" })] }), drafts.length > 1 && (_jsx("button", { type: "button", onClick: () => setDrafts((prev) => prev.filter((_, j) => j !== i)), className: "text-muted-foreground hover:text-red-500", children: _jsx(IconX, { className: "h-3.5 w-3.5" }) }))] }, i))) }), _jsxs("div", { className: "flex flex-wrap items-center gap-2", children: [_jsxs("button", { type: "button", onClick: () => setDrafts((prev) => [...prev, { email: "", role: "member" }]), className: "inline-flex items-center gap-1 rounded-md border border-border px-2.5 py-1.5 text-xs font-medium hover:bg-accent/50", children: [_jsx(IconPlus, { className: "h-3.5 w-3.5" }), "Add another"] }), _jsxs("button", { type: "button", onClick: () => setPasteOpen((v) => !v), className: "inline-flex items-center gap-1 rounded-md border border-border px-2.5 py-1.5 text-xs font-medium hover:bg-accent/50", children: [_jsx(IconUserPlus, { className: "h-3.5 w-3.5" }), "Paste many"] }), _jsxs("button", { type: "button", onClick: () => fileRef.current?.click(), className: "inline-flex items-center gap-1 rounded-md border border-border px-2.5 py-1.5 text-xs font-medium hover:bg-accent/50", children: [_jsx(IconFileImport, { className: "h-3.5 w-3.5" }), "Import CSV"] }), _jsx("input", { ref: fileRef, type: "file", accept: ".csv,text/csv,text/plain", className: "hidden", onChange: (e) => {
                            const file = e.target.files?.[0];
                            if (file)
                                handleFile(file);
                            // reset so re-uploading the same file re-fires onChange
                            e.target.value = "";
                        } })] }), pasteOpen && (_jsxs("div", { className: "space-y-2 rounded-md border border-border p-3", children: [_jsx("div", { className: "text-xs font-medium text-muted-foreground", children: "Paste emails (comma, space, or newline separated)" }), _jsx("textarea", { value: pasteValue, onChange: (e) => setPasteValue(e.target.value), rows: 4, placeholder: "alice@acme.com, bob@acme.com\ncharlie@acme.com", className: "w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-foreground" }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsxs("select", { value: pasteRole, onChange: (e) => setPasteRole(e.target.value === "admin" ? "admin" : "member"), disabled: !canSetAdmin, className: "rounded-md border border-border bg-background px-2 py-1.5 text-xs disabled:opacity-50", children: [_jsx("option", { value: "member", children: "Add as members" }), _jsx("option", { value: "admin", children: "Add as admins" })] }), _jsx("button", { type: "button", onClick: () => {
                                    appendEmails(parseEmailList(pasteValue), pasteRole);
                                    setPasteValue("");
                                    setPasteOpen(false);
                                }, disabled: parseEmailList(pasteValue).length === 0, className: "rounded-md bg-foreground px-3 py-1.5 text-xs font-medium text-background hover:opacity-90 disabled:opacity-50", children: "Add" }), _jsx("button", { type: "button", onClick: () => {
                                    setPasteValue("");
                                    setPasteOpen(false);
                                }, className: "rounded-md border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground", children: "Cancel" })] })] })), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("button", { type: "button", disabled: validDrafts.length === 0 || bulkInvite.isPending, onClick: submit, className: "rounded-md bg-foreground px-3 py-1.5 text-xs font-medium text-background hover:opacity-90 disabled:opacity-50", children: bulkInvite.isPending ? (_jsx(IconLoader2, { className: "h-3.5 w-3.5 animate-spin" })) : (_jsxs("span", { className: "inline-flex items-center gap-1", children: [_jsx(IconCheck, { className: "h-3.5 w-3.5" }), "Send ", validDrafts.length || "", " ", validDrafts.length === 1 ? "invite" : "invites"] })) }), _jsx("button", { type: "button", onClick: onClose, className: "rounded-md border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground", children: "Close" })] }), _jsxs("p", { className: "text-[11px] text-muted-foreground", children: ["Each invitee signs in with this exact email to accept.", canSetAdmin
                        ? " Admins can manage members and workspace settings."
                        : " Only the organization owner can grant admin access."] }), resultBanner && (_jsxs("div", { className: "space-y-1 rounded-md border border-border bg-accent/30 p-2.5", children: [resultBanner.succeeded > 0 && (_jsxs("p", { className: "text-[11px] text-green-600", children: [_jsx(IconCheck, { className: "inline h-3 w-3 -mt-0.5" }), " Sent", " ", resultBanner.succeeded, " ", resultBanner.succeeded === 1 ? "invite" : "invites", "."] })), resultBanner.failed.length > 0 && (_jsx("ul", { className: "space-y-0.5 text-[11px] text-red-500", children: resultBanner.failed.map((f) => (_jsxs("li", { children: [_jsx(IconAlertTriangle, { className: "inline h-3 w-3 -mt-0.5 mr-1" }), f.email, ": ", f.error] }, f.email))) }))] })), _jsx(ErrorText, { error: bulkInvite.error })] }));
}
function DomainSettingsSection({ domain, ownerEmail, }) {
    const setOrgDomain = useSetOrgDomain();
    const [editing, setEditing] = useState(false);
    const [draft, setDraft] = useState(domain ?? "");
    const ownDomain = ownerEmail.split("@")[1]?.toLowerCase() ?? "";
    function save() {
        const trimmed = draft.trim().toLowerCase();
        if (trimmed === (domain ?? "")) {
            setEditing(false);
            return;
        }
        setOrgDomain.mutate(trimmed || null, {
            onSuccess: () => setEditing(false),
        });
    }
    return (_jsxs("div", { className: "border-t border-border pt-3 space-y-2", children: [_jsx("div", { className: "text-xs font-medium text-muted-foreground uppercase tracking-wide", children: "Email domain auto-join" }), _jsxs("p", { className: "text-[11px] text-muted-foreground", children: ["Anyone who signs up with an email at this domain will join your organization automatically. You can only set your own email domain (", ownDomain || "—", "); free email providers like gmail.com or outlook.com aren't allowed."] }), !editing ? (_jsx("div", { className: "flex items-center gap-2", children: domain ? (_jsxs(_Fragment, { children: [_jsxs("span", { className: "inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-2.5 py-1.5 text-sm", children: [_jsx(IconAt, { className: "h-3.5 w-3.5 text-muted-foreground" }), domain] }), _jsxs(Tooltip, { children: [_jsx(TooltipTrigger, { asChild: true, children: _jsx("button", { type: "button", onClick: () => {
                                            setDraft(domain);
                                            setEditing(true);
                                        }, className: "text-muted-foreground hover:text-foreground", children: _jsx(IconPencil, { className: "h-3.5 w-3.5" }) }) }), _jsx(TooltipContent, { children: "Edit domain" })] }), _jsxs(Tooltip, { children: [_jsx(TooltipTrigger, { asChild: true, children: _jsx("button", { type: "button", disabled: setOrgDomain.isPending, onClick: () => setOrgDomain.mutate(null), className: "text-muted-foreground hover:text-red-500 disabled:opacity-50", children: _jsx(IconX, { className: "h-3.5 w-3.5" }) }) }), _jsx(TooltipContent, { children: "Remove domain" })] })] })) : (_jsxs("button", { type: "button", onClick: () => {
                        setDraft(ownDomain);
                        setEditing(true);
                    }, className: "flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs font-medium hover:bg-accent/50", children: [_jsx(IconAt, { className: "h-3.5 w-3.5" }), "Allow ", ownDomain || "your domain", " to auto-join"] })) })) : (_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("input", { type: "text", value: draft, onChange: (e) => setDraft(e.target.value), onKeyDown: (e) => {
                            if (e.key === "Enter")
                                save();
                            if (e.key === "Escape")
                                setEditing(false);
                        }, placeholder: ownDomain || "example.com", className: "rounded-md border border-border bg-background px-2.5 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-foreground", autoFocus: true }), _jsx("button", { type: "button", disabled: setOrgDomain.isPending, onClick: save, className: "rounded-md bg-foreground px-3 py-1.5 text-xs font-medium text-background hover:opacity-90 disabled:opacity-50", children: setOrgDomain.isPending ? (_jsx(IconLoader2, { className: "h-3.5 w-3.5 animate-spin" })) : ("Save") }), _jsx("button", { type: "button", onClick: () => setEditing(false), className: "rounded-md border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground", children: "Cancel" })] })), _jsx(ErrorText, { error: setOrgDomain.error })] }));
}
function A2ASecretSection({ secret }) {
    const setA2ASecret = useSetA2ASecret();
    const syncA2ASecret = useSyncA2ASecret();
    const [revealed, setRevealed] = useState(false);
    const [copied, setCopied] = useState(false);
    const [pasteMode, setPasteMode] = useState(false);
    const [pasteValue, setPasteValue] = useState("");
    const [syncResult, setSyncResult] = useState(null);
    function copyToClipboard() {
        if (!secret)
            return;
        navigator.clipboard.writeText(secret).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    }
    // Push the current secret to all connected apps. Optionally pass the
    // PREVIOUS secret as `signSecret` so the receiving apps (which still
    // hold the previous value) can verify the JWT.
    function syncToApps(signSecret) {
        setSyncResult(null);
        syncA2ASecret.mutate(signSecret ? { signSecret } : undefined, {
            onSuccess: (result) => {
                setSyncResult(result);
            },
        });
    }
    function regenerate() {
        setA2ASecret.mutate(undefined, {
            onSuccess: (result) => {
                setRevealed(false);
                // Auto-sync the new secret to all connected apps. Sign with the
                // PREVIOUS secret (which peers still hold) so verification on
                // their side succeeds and they accept the new value.
                syncToApps(result.previousSecret ?? undefined);
            },
        });
    }
    function saveSecret() {
        const trimmed = pasteValue.trim();
        if (!trimmed)
            return;
        setA2ASecret.mutate(trimmed, {
            onSuccess: (result) => {
                setPasteMode(false);
                setPasteValue("");
                // Same auto-sync flow as regenerate: peers verify with the
                // previous secret, then update to the new pasted value.
                syncToApps(result.previousSecret ?? undefined);
            },
        });
    }
    const masked = secret ? "****" + secret.slice(-8) : "Not set";
    return (_jsxs("div", { className: "border-t border-border pt-3 space-y-2", children: [_jsx("div", { className: "text-xs font-medium text-muted-foreground uppercase tracking-wide", children: "Cross-app authentication" }), _jsx("p", { className: "text-[11px] text-muted-foreground", children: "This secret authenticates cross-app delegation (e.g. Dispatch to Analytics). All apps in your organization need the same secret." }), _jsxs("div", { className: "flex items-center gap-2 flex-wrap", children: [_jsxs("span", { className: "inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-2.5 py-1.5 text-sm font-mono", children: [_jsx(IconKey, { className: "h-3.5 w-3.5 text-muted-foreground" }), revealed && secret ? secret : masked] }), secret && (_jsxs(_Fragment, { children: [_jsxs(Tooltip, { children: [_jsx(TooltipTrigger, { asChild: true, children: _jsx("button", { type: "button", onClick: () => setRevealed(!revealed), className: "text-muted-foreground hover:text-foreground", children: revealed ? (_jsx(IconEyeOff, { className: "h-3.5 w-3.5" })) : (_jsx(IconEye, { className: "h-3.5 w-3.5" })) }) }), _jsx(TooltipContent, { children: revealed ? "Hide secret" : "Reveal secret" })] }), _jsxs(Tooltip, { children: [_jsx(TooltipTrigger, { asChild: true, children: _jsx("button", { type: "button", onClick: copyToClipboard, className: "text-muted-foreground hover:text-foreground", children: copied ? (_jsx(IconCheck, { className: "h-3.5 w-3.5 text-green-500" })) : (_jsx(IconCopy, { className: "h-3.5 w-3.5" })) }) }), _jsx(TooltipContent, { children: "Copy secret" })] })] })), _jsxs(Tooltip, { children: [_jsx(TooltipTrigger, { asChild: true, children: _jsxs("button", { type: "button", onClick: regenerate, disabled: setA2ASecret.isPending || syncA2ASecret.isPending, className: "inline-flex items-center gap-1 rounded-md border border-border px-2.5 py-1.5 text-xs font-medium hover:bg-accent/50 disabled:opacity-50", children: [setA2ASecret.isPending ? (_jsx(IconLoader2, { className: "h-3.5 w-3.5 animate-spin" })) : (_jsx(IconRefresh, { className: "h-3.5 w-3.5" })), "Regenerate"] }) }), _jsx(TooltipContent, { children: "Regenerate secret and sync to connected apps" })] }), secret && (_jsxs(Tooltip, { children: [_jsx(TooltipTrigger, { asChild: true, children: _jsxs("button", { type: "button", onClick: () => syncToApps(), disabled: setA2ASecret.isPending || syncA2ASecret.isPending, className: "inline-flex items-center gap-1 rounded-md border border-border px-2.5 py-1.5 text-xs font-medium hover:bg-accent/50 disabled:opacity-50", children: [syncA2ASecret.isPending ? (_jsx(IconLoader2, { className: "h-3.5 w-3.5 animate-spin" })) : (_jsx(IconCloudUpload, { className: "h-3.5 w-3.5" })), "Sync to apps"] }) }), _jsx(TooltipContent, { children: "Push this secret to every connected app" })] }))] }), syncA2ASecret.isPending && (_jsx("p", { className: "text-[11px] text-muted-foreground", children: "Syncing to connected apps\u2026" })), syncResult && !syncA2ASecret.isPending && (_jsxs("div", { className: "space-y-1", children: [_jsxs("p", { className: "text-[11px] text-muted-foreground", children: ["Synced to ", syncResult.succeeded, "/", syncResult.total, " app", syncResult.total === 1 ? "" : "s", syncResult.failed > 0 ? ` (${syncResult.failed} failed)` : "", "."] }), syncResult.failed > 0 && (_jsx("ul", { className: "text-[11px] text-red-500 list-disc pl-5 space-y-0.5", children: syncResult.results
                            .filter((r) => !r.ok)
                            .map((r) => (_jsxs("li", { children: [r.name, ": ", r.error || `HTTP ${r.status ?? "?"}`] }, r.id))) }))] })), !pasteMode ? (_jsxs("button", { type: "button", onClick: () => setPasteMode(true), className: "flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs font-medium hover:bg-accent/50", children: [_jsx(IconKey, { className: "h-3.5 w-3.5" }), "Paste secret from another app"] })) : (_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("input", { type: "text", value: pasteValue, onChange: (e) => setPasteValue(e.target.value), onKeyDown: (e) => {
                            if (e.key === "Enter")
                                saveSecret();
                            if (e.key === "Escape") {
                                setPasteMode(false);
                                setPasteValue("");
                            }
                        }, placeholder: "Paste A2A secret", className: "flex-1 rounded-md border border-border bg-background px-2.5 py-1.5 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-foreground", autoFocus: true }), _jsx("button", { type: "button", disabled: !pasteValue.trim() || setA2ASecret.isPending, onClick: saveSecret, className: "rounded-md bg-foreground px-3 py-1.5 text-xs font-medium text-background hover:opacity-90 disabled:opacity-50", children: setA2ASecret.isPending ? (_jsx(IconLoader2, { className: "h-3.5 w-3.5 animate-spin" })) : ("Save") }), _jsx("button", { type: "button", onClick: () => {
                            setPasteMode(false);
                            setPasteValue("");
                        }, className: "rounded-md border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground", children: "Cancel" })] })), _jsx(ErrorText, { error: setA2ASecret.error }), _jsx(ErrorText, { error: syncA2ASecret.error })] }));
}
/**
 * Default Team management page. Templates can route directly to this component
 * or wrap it with their own Layout via the `layout` prop.
 */
export function TeamPage({ layout, title = "Team", createOrgDescription, className, }) {
    const { data: org, isLoading } = useOrg();
    const content = (_jsxs("div", { className: `space-y-6 max-w-2xl ${className ?? ""}`, children: [_jsx("h2", { className: "text-2xl font-bold tracking-tight", children: title }), isLoading && (_jsx("section", { className: "rounded-lg border border-border bg-card p-6", children: _jsx("div", { className: "text-sm text-muted-foreground", children: "Loading\u2026" }) })), !isLoading && (_jsxs(_Fragment, { children: [_jsx(PendingInvitationsCard, {}), !org?.orgId ? (_jsxs(_Fragment, { children: [org?.domainMatches && org.domainMatches.length > 0 && (_jsx(JoinByDomainCard, { matches: org.domainMatches })), _jsx(CreateOrgCard, { description: createOrgDescription })] })) : (_jsx(MembersCard, {}))] }))] }));
    const wrapped = (_jsx(TooltipProvider, { delayDuration: 200, children: content }));
    return layout ? _jsx(_Fragment, { children: layout(wrapped) }) : wrapped;
}
//# sourceMappingURL=TeamPage.js.map