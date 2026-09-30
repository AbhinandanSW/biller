import { LayoutDashboard, ReceiptText, Users, type LucideIcon } from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  /** Shorter label for the mobile bottom bar. */
  shortLabel?: string;
}

export interface NavGroup {
  label?: string;
  items: NavItem[];
}

// Three main tabs — Dashboard, Orders & invoices, Customers. Modules are
// added here only once they're built, so every link works.
export const NAVIGATION: NavGroup[] = [
  {
    items: [
      { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { label: "Orders & invoices", shortLabel: "Orders", href: "/orders", icon: ReceiptText },
      { label: "Customers", href: "/customers", icon: Users },
    ],
  },
];

const ALL_ITEMS = NAVIGATION.flatMap((g) => g.items);

/** Primary destinations for the mobile bottom bar, in order. */
const BOTTOM_NAV_HREFS = ["/dashboard", "/orders", "/customers"];

export const BOTTOM_NAV_ITEMS = BOTTOM_NAV_HREFS.flatMap((href) =>
  ALL_ITEMS.filter((item) => item.href === href),
);

export function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}
