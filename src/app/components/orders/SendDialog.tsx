"use client";

import { FileText, Mail, MessageCircle } from "lucide-react";
import { useState, useTransition } from "react";

import { sendDocument } from "@/api/orders/send";
import {
  Alert,
  Button,
  Dialog,
  DialogClose,
  DialogContent,
  Field,
  Input,
  Textarea,
  toast,
} from "@/app/components/ui";
import type { DocumentKind, SendChannel } from "@/types/order";

export interface SendDialogState {
  channel: SendChannel;
  kind: DocumentKind;
  documentNumber: string;
  fileName: string;
  to: string;
  subject: string;
  message: string;
  /** For WhatsApp: the approved template text as the customer will see it. */
  preview?: string;
}

/** Confirm recipient and message, then send the PDF from the server. */
export function SendDialog({
  orderId,
  state,
  onClose,
}: {
  orderId: string;
  state: SendDialogState;
  onClose: () => void;
}) {
  const [to, setTo] = useState(state.to);
  const [subject, setSubject] = useState(state.subject);
  const [message, setMessage] = useState(state.message);
  const [error, setError] = useState<string | null>(null);
  const [sending, startSending] = useTransition();
  const email = state.channel === "EMAIL";

  const send = () => {
    setError(null);
    startSending(async () => {
      const result = await sendDocument(
        email
          ? { channel: "EMAIL", orderId, kind: state.kind, to, subject, message }
          : { channel: "WHATSAPP", orderId, kind: state.kind, to },
      );
      if (result.error) {
        setError(result.error);
        return;
      }
      toast.success(
        `${state.kind === "invoice" ? "Invoice" : "Order"} sent`,
        `${state.documentNumber} ${email ? "emailed" : "sent on WhatsApp"} to ${to}`,
      );
      onClose();
    });
  };

  return (
    <Dialog open onOpenChange={(open) => !open && !sending && onClose()}>
      <DialogContent
        title={`${email ? "Email" : "WhatsApp"} ${state.kind === "invoice" ? "invoice" : "order"} ${state.documentNumber}`}
        description={
          email ? "The PDF is attached to the email." : "The PDF is sent as a WhatsApp document."
        }
        footer={
          <>
            <DialogClose asChild>
              <Button variant="secondary" disabled={sending}>
                Cancel
              </Button>
            </DialogClose>
            <Button onClick={send} loading={sending}>
              {email ? <Mail aria-hidden /> : <MessageCircle aria-hidden />}
              Send
            </Button>
          </>
        }
      >
        <form
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            send();
          }}
        >
          {error && <Alert variant="danger">{error}</Alert>}
          <Field
            label="To"
            required
            description={email ? undefined : "With country code, e.g. +91 98140 12345"}
          >
            <Input
              type={email ? "email" : "tel"}
              value={to}
              onChange={(e) => setTo(e.target.value)}
              autoFocus={!state.to}
            />
          </Field>
          {email ? (
            <>
              <Field label="Subject" required>
                <Input value={subject} onChange={(e) => setSubject(e.target.value)} />
              </Field>
              <Field label="Message" required>
                <Textarea rows={8} value={message} onChange={(e) => setMessage(e.target.value)} />
              </Field>
            </>
          ) : (
            state.preview && (
              <div className="flex flex-col gap-1.5">
                <span className="text-label">Message</span>
                <p className="rounded-md bg-surface-muted p-3 text-body whitespace-pre-line">
                  {state.preview}
                </p>
                <span className="text-caption text-muted-foreground">
                  WhatsApp only allows approved templates, so this text can&apos;t be edited here.
                </span>
              </div>
            )
          )}
          <div className="flex items-center gap-2 rounded-md border border-border px-3 py-2 text-body">
            <FileText className="size-4 text-danger" aria-hidden />
            <span className="truncate">{state.fileName}</span>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
