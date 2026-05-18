import { type CollabUser } from "../../collab/client.js";
export interface PresenceBarProps {
    /** Active collaborators on this document. */
    activeUsers: CollabUser[];
    /** Whether the agent has a durable presence entry. */
    agentPresent?: boolean;
    /** Whether the agent is actively making edits right now. */
    agentActive?: boolean;
    /** Current user's email (to exclude from the list). */
    currentUserEmail?: string;
    /** Max visible avatars before "+N" overflow. Default: 5 */
    maxVisible?: number;
    /** Additional CSS classes. */
    className?: string;
}
export declare function PresenceBar({ activeUsers, agentPresent, agentActive, currentUserEmail, maxVisible, className, }: PresenceBarProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=PresenceBar.d.ts.map