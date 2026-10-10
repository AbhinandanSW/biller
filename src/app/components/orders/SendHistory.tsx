import { Mail, MessageCircle } from "lucide-react";

import { Badge, Card, CardContent, CardHeader } from "@/app/components/ui";
import type { DocumentSend } from "@/types/order";

const time = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  hour: "numeric",
  minute: "2-digit",
  timeZone: "Asia/Kolkata",
});

/** What was sent to the customer, and whether it went through. */
export function SendHistory({ sends }: { sends: DocumentSend[] }) {
  if (sends.length === 0) return null;
  return (
    <Card>
      <CardHeader title="Sent" />
      <CardContent>
        <ul className="flex flex-col gap-3">
          {sends.map((send) => (
            <li key={send.id} className="flex gap-3">
              <span className="mt-0.5 text-muted-foreground [&_svg]:size-4">
                {send.channel === "EMAIL" ? (
                  <Mail aria-label="Email" />
                ) : (
                  <MessageCircle aria-label="WhatsApp" />
                )}
              </span>
              <div className="flex min-w-0 flex-1 flex-col">
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-label">{send.recipient}</span>
                  <Badge
                    variant={
                      send.status === "SENT"
                        ? "success"
                        : send.status === "FAILED"
                          ? "danger"
                          : "neutral"
                    }
                  >
                    {send.status === "SENT"
                      ? "Sent"
                      : send.status === "FAILED"
                        ? "Failed"
                        : "Sending"}
                  </Badge>
                </div>
                <span className="text-caption text-muted-foreground">
                  {send.documentNumber} · {time.format(new Date(send.createdAt))}
                  {send.sentByName && ` · ${send.sentByName}`}
                </span>
                {send.error && <span className="text-caption text-danger">{send.error}</span>}
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
