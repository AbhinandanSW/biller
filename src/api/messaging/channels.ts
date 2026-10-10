import "server-only";

import type { Role } from "@/types/auth";
import type { SendingChannels } from "@/types/order";
import { roleHasPermission } from "@/utils/permissions";

import { isEmailConfigured } from "./email";
import { isWhatsAppConfigured } from "./whatsapp";

/** The channels this role can send documents through. */
export function sendingChannels(role: Role): SendingChannels {
  if (!roleHasPermission(role, "invoices.send")) return null;
  return { email: isEmailConfigured(), whatsapp: isWhatsAppConfigured() };
}
