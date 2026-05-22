import { formatTaskPriority } from "../api/adapters";
import type { TaskPriority } from "../types/api";

interface PriorityBadgeProps {
  priority: TaskPriority | null | undefined;
}

export function PriorityBadge({ priority }: PriorityBadgeProps) {
  return (
    <span className="priority-badge" data-priority={priority ?? "empty"}>
      {formatTaskPriority(priority)}
    </span>
  );
}
