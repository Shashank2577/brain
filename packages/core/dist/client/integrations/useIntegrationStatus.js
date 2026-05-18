import { useState, useEffect, useCallback, useRef } from "react";
import { agentNativePath } from "../api-path.js";
export function useIntegrationStatus() {
    const [statuses, setStatuses] = useState([]);
    const [loading, setLoading] = useState(true);
    const mountedRef = useRef(true);
    const fetchStatuses = useCallback(async () => {
        try {
            const res = await fetch(agentNativePath("/_agent-native/integrations/status"));
            if (!res.ok) {
                if (mountedRef.current)
                    setLoading(false);
                return;
            }
            const data = await res.json();
            if (mountedRef.current) {
                setStatuses(Array.isArray(data) ? data : []);
                setLoading(false);
            }
        }
        catch {
            if (mountedRef.current) {
                setLoading(false);
            }
        }
    }, []);
    useEffect(() => {
        mountedRef.current = true;
        fetchStatuses();
        const interval = setInterval(fetchStatuses, 30000);
        return () => {
            mountedRef.current = false;
            clearInterval(interval);
        };
    }, [fetchStatuses]);
    return { statuses, loading, refetch: fetchStatuses };
}
//# sourceMappingURL=useIntegrationStatus.js.map