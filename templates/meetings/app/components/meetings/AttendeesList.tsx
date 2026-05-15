interface Attendee {
  email: string | null;
  name: string;
  role: string;
  isOwner: boolean;
}

export function AttendeesList({ attendees }: { attendees: Attendee[] }) {
  if (attendees.length === 0) return null;
  const visible = attendees.slice(0, 5);
  const overflow = attendees.length - visible.length;
  return (
    <div className="flex items-center gap-2">
      <div className="flex -space-x-2">
        {visible.map((a, i) => (
          <span
            key={`${a.email ?? a.name}-${i}`}
            title={`${a.name}${a.email ? ` (${a.email})` : ""}${
              a.role === "organizer" ? " — organizer" : ""
            }`}
            className="inline-flex h-7 w-7 items-center justify-center rounded-full border-2 border-background bg-secondary text-xs font-medium text-secondary-foreground"
          >
            {initials(a.name)}
          </span>
        ))}
        {overflow > 0 && (
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-full border-2 border-background bg-secondary text-xs font-medium text-secondary-foreground">
            +{overflow}
          </span>
        )}
      </div>
      <span className="text-xs text-muted-foreground">
        {attendees.length} attendee{attendees.length === 1 ? "" : "s"}
      </span>
    </div>
  );
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .slice(0, 2)
    .join("");
}
