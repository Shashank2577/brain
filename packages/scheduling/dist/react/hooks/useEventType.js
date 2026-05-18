/**
 * useEventType — fetch one event type by id or slug via a consumer-provided
 * callback (typically calling the `get-event-type` action).
 */
import { useEffect, useState } from "react";
export function useEventType(opts) {
    const [eventType, setEventType] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    useEffect(() => {
        let cancelled = false;
        setIsLoading(true);
        opts
            .fetchEventType({
            id: opts.id,
            slug: opts.slug,
            ownerEmail: opts.ownerEmail,
            teamId: opts.teamId,
        })
            .then((r) => {
            if (cancelled)
                return;
            setEventType(r.eventType);
            setIsLoading(false);
        })
            .catch((err) => {
            if (cancelled)
                return;
            setError(err);
            setIsLoading(false);
        });
        return () => {
            cancelled = true;
        };
    }, [opts.id, opts.slug, opts.ownerEmail, opts.teamId, opts.fetchEventType]);
    return { eventType, isLoading, error };
}
//# sourceMappingURL=useEventType.js.map