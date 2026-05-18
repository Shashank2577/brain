export interface AgentTaskCardProps {
    taskId: string;
    threadId: string;
    description: string;
    onOpen?: (threadId: string) => void;
}
/**
 * Rich preview card for a sub-agent task. Listens for agent-task-event
 * CustomEvents to update its state in real-time.
 */
export declare function AgentTaskCard({ taskId, threadId, description, onOpen, }: AgentTaskCardProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=AgentTaskCard.d.ts.map