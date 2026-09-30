"use client";

import {
  ChevronDown,
  Copy,
  Download,
  FileText,
  Mail,
  MessageCircle,
  Receipt,
  Share2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useSyncExternalStore, useTransition } from "react";

import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  toast,
} from "@/components/ui";
import { formatDate } from "@/lib/utils/format";

import { ensureInvoice } from "../actions";
import { shareMessage, whatsAppNumber } from "../share";

export interface DocumentActionsProps {
  orderId: string;
  orderNumber: string;
  status: "DRAFT" | "CONFIRMED" | "CANCELLED";
  invoice: { number: string; dueDate: string; cancelled: boolean } | null;
  /** Whether this user may issue invoices (needed to share one that doesn't exist yet). */
  canIssueInvoice: boolean;
  customer: { name: string; phone: string | null; email: string | null };
  businessName: string;
  grandTotal: string;
  /** Public link to the PDF (no login needed). */
  shareUrl: string;
}

const canShareFiles = () =>
  typeof navigator !== "undefined" &&
  typeof navigator.canShare === "function" &&
  navigator.canShare({ files: [new File([""], "x.pdf", { type: "application/pdf" })] });

/**
 * Download and Share for an order. For confirmed orders these work on the
 * tax invoice, issuing it (and its number) the first time — there's no
 * separate "generate" step.
 */
export function DocumentActions(props: DocumentActionsProps) {
  const { orderId, orderNumber, status, invoice, canIssueInvoice, customer, businessName } = props;
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const nativeShare = useSyncExternalStore(
    () => () => {},
    canShareFiles,
    () => false,
  );

  const invoiceAvailable =
    status === "CONFIRMED" && ((invoice && !invoice.cancelled) || canIssueInvoice);
  // What "Share" sends: the invoice once an order is confirmed, otherwise the order.
  const shareKind: "invoice" | "order" = invoiceAvailable ? "invoice" : "order";

  /** The order's invoice, issuing it if needed. Null on failure (already reported). */
  const getInvoice = async (): Promise<{ number: string; dueDate: string } | null> => {
    if (invoice && !invoice.cancelled) return invoice;
    const result = await ensureInvoice(orderId);
    if ("error" in result) {
      toast.error("Couldn't issue the invoice", result.error);
      return null;
    }
    if (result.issued) {
      toast.success("Invoice issued", result.number);
      router.refresh();
    }
    return result;
  };

  /** Number and due date of the document being shared, or null on failure. */
  const getShared = async (): Promise<{ number: string; dueDate: string | null } | null> =>
    shareKind === "invoice" ? getInvoice() : { number: orderNumber, dueDate: null };

  const pdfUrl = (kind: "invoice" | "order", download: boolean) =>
    `/orders/${orderId}/pdf?type=${kind}${download ? "&download=1" : ""}`;

  const message = (kind: "invoice" | "order", doc: { number: string; dueDate: string | null }) =>
    shareMessage({
      kind,
      number: doc.number,
      customerName: customer.name,
      businessName,
      grandTotal: props.grandTotal,
      dueDate: doc.dueDate ? formatDate(doc.dueDate) : null,
      link: kind === "invoice" ? props.shareUrl : `${props.shareUrl}?type=order`,
    });

  const download = (kind: "invoice" | "order") =>
    startTransition(async () => {
      if (kind === "invoice" && !(await getInvoice())) return;
      // The response is an attachment, so the browser saves it and stays on this page.
      window.location.href = pdfUrl(kind, true);
    });

  const whatsApp = () => {
    // Open the tab now: browsers block pop-ups opened after an await.
    const tab = window.open("about:blank", "_blank");
    startTransition(async () => {
      const doc = await getShared();
      if (!doc) {
        tab?.close();
        return;
      }
      const phone = whatsAppNumber(customer.phone);
      const text = encodeURIComponent(message(shareKind, doc).body);
      const url = phone ? `https://wa.me/${phone}?text=${text}` : `https://wa.me/?text=${text}`;
      if (tab) tab.location.href = url;
      else window.location.href = url;
      if (!phone)
        toast({ title: "No WhatsApp number saved", description: "Pick the chat in WhatsApp." });
    });
  };

  const email = () =>
    startTransition(async () => {
      const doc = await getShared();
      if (!doc) return;
      const { subject, body } = message(shareKind, doc);
      const to = customer.email ? encodeURIComponent(customer.email) : "";
      window.location.href = `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    });

  const copyLink = () =>
    startTransition(async () => {
      if (!(await getShared())) return;
      const link = shareKind === "invoice" ? props.shareUrl : `${props.shareUrl}?type=order`;
      try {
        await navigator.clipboard.writeText(link);
        toast.success("Link copied", "Anyone with the link can open this PDF.");
      } catch {
        toast.error("Couldn't copy", link);
      }
    });

  const shareFile = () =>
    startTransition(async () => {
      const doc = await getShared();
      if (!doc) return;
      try {
        const response = await fetch(pdfUrl(shareKind, false));
        if (!response.ok) throw new Error(await response.text());
        const blob = await response.blob();
        const file = new File([blob], `${doc.number}.pdf`, { type: "application/pdf" });
        const { subject, body } = message(shareKind, doc);
        await navigator.share({ files: [file], title: subject, text: body });
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          toast.error("Couldn't share the file", (error as Error).message);
        }
      }
    });

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="secondary" loading={pending}>
            <Download aria-hidden />
            Download
            <ChevronDown aria-hidden />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          {invoiceAvailable && (
            <DropdownMenuItem onSelect={() => download("invoice")}>
              <Receipt aria-hidden />
              Tax invoice (PDF)
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onSelect={() => download("order")}>
            <FileText aria-hidden />
            {status === "DRAFT" ? "Draft order (PDF)" : "Order confirmation (PDF)"}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {status !== "CANCELLED" && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button loading={pending}>
              <Share2 aria-hidden />
              Share
              <ChevronDown aria-hidden />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-64">
            <DropdownMenuLabel className="text-caption text-muted-foreground">
              Send the {shareKind === "invoice" ? "invoice" : "order"} to {customer.name}
            </DropdownMenuLabel>
            <DropdownMenuItem onSelect={whatsApp}>
              <MessageCircle aria-hidden />
              WhatsApp
              {customer.phone && (
                <span className="ml-auto text-caption text-muted-foreground">{customer.phone}</span>
              )}
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={email}>
              <Mail aria-hidden />
              Email
              {customer.email && (
                <span className="ml-auto max-w-32 truncate text-caption text-muted-foreground">
                  {customer.email}
                </span>
              )}
            </DropdownMenuItem>
            {nativeShare && (
              <DropdownMenuItem onSelect={shareFile}>
                <Share2 aria-hidden />
                Share PDF file…
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={copyLink}>
              <Copy aria-hidden />
              Copy link
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </>
  );
}
