import {
  Clock,
  IndianRupee,
  Pencil,
  Plus,
  ReceiptText,
  ShoppingCart,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";

import { Detail } from "@/app/components/common/Detail";
import { StatCard } from "@/app/components/common/StatCard";
import { PageHeader } from "@/app/components/layout/PageHeader";
import { OrdersTable } from "@/app/components/orders/OrdersTable";
import {
  Badge,
  buttonClassName,
  Card,
  CardContent,
  CardHeader,
  EmptyState,
} from "@/app/components/ui";
import type { Customer, CustomerStats } from "@/types/customer";
import type { OrderRow } from "@/types/order";
import { formatAddress, stateName } from "@/utils/address";
import { formatDate, formatMoney } from "@/utils/format";

import { CustomerArchiveButton } from "./CustomerArchiveButton";

export function CustomerDetail({
  customer,
  stats,
  orders,
  orderCount,
  sellerStateCode,
  canEdit,
  canCreateOrder,
}: {
  customer: Customer;
  stats: CustomerStats;
  orders: OrderRow[];
  orderCount: number;
  sellerStateCode: string | null;
  canEdit: boolean;
  canCreateOrder: boolean;
}) {
  const archived = customer.status === "ARCHIVED";
  const intraState = sellerStateCode === customer.billing.stateCode;

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <PageHeader
        back={{ href: "/customers", label: "Customers" }}
        title={customer.name}
        description={
          <div className="flex flex-wrap items-center gap-2">
            {archived && <Badge>Archived</Badge>}
            {customer.code && <span className="font-mono text-caption">{customer.code}</span>}
            <span>{stateName(customer.billing.stateCode)}</span>
          </div>
        }
        actions={
          <>
            {canEdit && (
              <>
                <CustomerArchiveButton
                  customerId={customer.id}
                  name={customer.name}
                  archived={archived}
                />
                <Link
                  href={`/customers/${customer.id}/edit`}
                  className={buttonClassName({ variant: "secondary" })}
                >
                  <Pencil aria-hidden />
                  Edit
                </Link>
              </>
            )}
            {!archived && canCreateOrder && (
              <Link href={`/orders/new?customer=${customer.id}`} className={buttonClassName()}>
                <Plus aria-hidden />
                New order
              </Link>
            )}
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Orders" value={stats.orderCount} icon={<ReceiptText />} tone="accent" />
        <StatCard
          label="Revenue"
          value={formatMoney(stats.revenue)}
          hint="Invoiced, excluding cancelled"
          icon={<IndianRupee />}
          tone="primary"
        />
        <StatCard
          label="Outstanding"
          value={formatMoney(stats.outstanding)}
          hint={stats.outstanding ? "Unpaid invoices" : "Nothing due"}
          icon={<Clock />}
          tone={stats.outstanding ? "warning" : "neutral"}
        />
        <StatCard
          label="Average order"
          value={formatMoney(stats.averageOrderValue)}
          icon={<TrendingUp />}
          tone="success"
          hint={
            stats.lastOrderDate ? `Last order ${formatDate(stats.lastOrderDate)}` : "No orders yet"
          }
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader title="Contact & GST" />
          <CardContent>
            <dl className="flex flex-col gap-4">
              <Detail label="Contact person">{customer.contactPerson ?? "—"}</Detail>
              <Detail label="Phone">
                {customer.phone ? (
                  <a href={`tel:${customer.phone}`} className="text-primary hover:underline">
                    {customer.phone}
                  </a>
                ) : (
                  "—"
                )}
              </Detail>
              <Detail label="Email">
                {customer.email ? (
                  <a href={`mailto:${customer.email}`} className="text-primary hover:underline">
                    {customer.email}
                  </a>
                ) : (
                  "—"
                )}
              </Detail>
              <Detail label="GSTIN">
                {customer.gstin ? (
                  <span className="font-mono">{customer.gstin}</span>
                ) : (
                  "Unregistered"
                )}
              </Detail>
              <Detail label="Tax on orders">
                {intraState ? "CGST + SGST (same state)" : "IGST (different state)"}
              </Detail>
            </dl>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader title="Addresses" />
          <CardContent>
            <dl className="grid gap-4 sm:grid-cols-2">
              <Detail label="Billing">{formatAddress(customer.billing)}</Detail>
              <Detail label="Shipping">
                {customer.shippingSameAsBilling || !customer.shipping
                  ? "Same as billing"
                  : formatAddress(customer.shipping)}
              </Detail>
            </dl>
            {customer.notes && (
              <p className="mt-5 border-t border-border pt-4 whitespace-pre-line text-muted-foreground">
                {customer.notes}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader
          title="Order history"
          description={`${orderCount} ${orderCount === 1 ? "order" : "orders"}`}
          actions={
            orderCount > orders.length && (
              <Link
                href={`/orders?q=${encodeURIComponent(customer.name)}`}
                className="text-label text-primary hover:underline"
              >
                View all
              </Link>
            )
          }
        />
        <CardContent className="px-0 pb-0">
          {orders.length === 0 ? (
            <EmptyState
              icon={<ShoppingCart />}
              title="No orders yet"
              action={
                !archived &&
                canCreateOrder && (
                  <Link href={`/orders/new?customer=${customer.id}`} className={buttonClassName()}>
                    <Plus aria-hidden />
                    New order
                  </Link>
                )
              }
            />
          ) : (
            <OrdersTable orders={orders} showCustomer={false} label="Order history" />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
