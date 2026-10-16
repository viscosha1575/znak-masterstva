import { Badge, type BadgeTone } from "@/components/ui/Badge";
import { type Status, statusTitle } from "@/lib/dictionaries";

const tones: Record<Status, BadgeTone> = {
  moderation: "blue",
  approved: "green",
  rejected: "red",
};

export function StatusBadge({
  status,
  className,
}: {
  status: Status;
  className?: string;
}) {
  return (
    <Badge tone={tones[status]} className={className}>
      {statusTitle(status)}
    </Badge>
  );
}
