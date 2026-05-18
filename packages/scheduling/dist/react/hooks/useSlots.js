/**
 * useSlots — fetches available time slots for an event type over a date
 * range. Plays well with @tanstack/react-query when it's available, falls
 * back to a plain fetch + state when not.
 *
 * The hook is transport-agnostic: consumers pass a `fetchSlots` callback
 * that calls their own API (typically an action like `check-availability`).
 */
import { useEffect, useState, useCallback } from "react";
export function useSlots(opts) {
    const [slots, setSlots] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [tick, setTick] = useState(0);
    const load = useCallback(async () => {
        if (opts.enabled === false)
            return;
        if (!opts.eventTypeId && !opts.slug)
            return;
        setIsLoading(true);
        setError(null);
        try {
            const result = await opts.fetchSlots({
                eventTypeId: opts.eventTypeId,
                slug: opts.slug,
                ownerEmail: opts.ownerEmail,
                teamId: opts.teamId,
                from: opts.from,
                to: opts.to,
                timezone: opts.timezone,
            });
            setSlots(result.slots);
        }
        catch (err) {
            setError(err);
            setSlots([]);
        }
        finally {
            setIsLoading(false);
        }
    }, [
        opts.enabled,
        opts.eventTypeId,
        opts.slug,
        opts.ownerEmail,
        opts.teamId,
        opts.from,
        opts.to,
        opts.timezone,
        opts.fetchSlots,
        tick,
    ]);
    useEffect(() => {
        load();
    }, [load]);
    const refetch = useCallback(() => setTick((t) => t + 1), []);
    return { slots, isLoading, error, refetch };
}
//# sourceMappingURL=useSlots.js.map