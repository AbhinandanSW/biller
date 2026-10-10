"use client";

import { Package, Plus, Search } from "lucide-react";
import type { ReactNode } from "react";

import {
  Alert,
  Badge,
  Button,
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  Checkbox,
  Dialog,
  DialogClose,
  DialogContent,
  DialogTrigger,
  Drawer,
  DrawerContent,
  DrawerTrigger,
  EmptyState,
  Field,
  Input,
  Select,
  Skeleton,
  Spinner,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Textarea,
  toast,
} from "@/app/components/ui";
import { GST_STATES } from "@/constants/gst-states";

const COLORS = [
  "background",
  "surface",
  "surface-muted",
  "border",
  "foreground",
  "muted-foreground",
  "primary",
  "success",
  "warning",
  "danger",
];

const PRODUCTS = [
  { name: "Product A", sku: "A001", price: "₹500.00", gst: "18%", active: true },
  { name: "Product B", sku: "B001", price: "₹800.00", gst: "18%", active: true },
  { name: "Product C", sku: "C001", price: "₹1,250.00", gst: "5%", active: false },
];

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-heading">{title}</h2>
      {children}
    </section>
  );
}

export function Showcase() {
  const states = GST_STATES.map((s) => ({ value: s.code, label: `${s.name} (${s.code})` }));

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-12 px-4 py-10 sm:px-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-display">Design system</h1>
        <p className="text-muted-foreground">
          Components from <code className="font-mono text-caption">@/app/components/ui</code>. Only
          available in development.
        </p>
      </header>

      <Section title="Colour tokens">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {COLORS.map((color) => (
            <div key={color} className="flex flex-col gap-1.5">
              <div
                className="h-12 rounded-md border border-border"
                style={{ background: `var(--${color})` }}
              />
              <span className="text-caption text-muted-foreground">{color}</span>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Typography">
        <div className="flex flex-col gap-2">
          <p className="text-display">Display · ₹12,45,000</p>
          <p className="text-heading">Heading · Orders</p>
          <p className="text-title">Title · Business profile</p>
          <p className="text-body">Body · Please find your invoice attached.</p>
          <p className="text-label">Label · GSTIN</p>
          <p className="text-caption text-muted-foreground">Caption · Updated 2 minutes ago</p>
        </div>
      </Section>

      <Section title="Buttons">
        <div className="flex flex-wrap items-center gap-3">
          <Button>
            <Plus aria-hidden /> Create order
          </Button>
          <Button variant="secondary">Save draft</Button>
          <Button variant="ghost">Cancel</Button>
          <Button variant="danger">Cancel order</Button>
          <Button loading>Saving</Button>
          <Button disabled>Disabled</Button>
          <Button size="sm" variant="secondary">
            Small
          </Button>
          <Button size="lg">Large</Button>
          <Button size="icon" variant="secondary" aria-label="Search">
            <Search aria-hidden />
          </Button>
          <Spinner />
        </div>
      </Section>

      <Section title="Form controls">
        <Card>
          <CardContent className="grid gap-5 sm:grid-cols-2">
            <Field label="Business name" required description="As it should appear on invoices">
              <Input placeholder="ABC Distributors" />
            </Field>
            <Field label="GSTIN" error="Enter a valid 15-character GSTIN">
              <Input defaultValue="03AAACA1234" />
            </Field>
            <Field label="Selling price">
              <Input prefix="₹" inputMode="decimal" placeholder="0.00" className="tabular" />
            </Field>
            <Field label="Default GST rate">
              <Input suffix="%" inputMode="decimal" defaultValue="18" />
            </Field>
            <Field label="State" required>
              <Select name="stateCode" options={states} placeholder="Select state" />
            </Field>
            <Field label="Search">
              <Input prefix={<Search />} placeholder="Search products…" type="search" />
            </Field>
            <Field label="Notes" className="sm:col-span-2">
              <Textarea placeholder="Terms & conditions" />
            </Field>
            <Switch
              label="GST enabled"
              description="Charge CGST/SGST or IGST on orders"
              defaultChecked
            />
            <Checkbox label="Prices include tax" />
          </CardContent>
          <CardFooter>
            <Button variant="ghost">Cancel</Button>
            <Button>Save changes</Button>
          </CardFooter>
        </Card>
      </Section>

      <Section title="Badges & alerts">
        <div className="flex flex-wrap gap-2">
          <Badge>Draft</Badge>
          <Badge variant="primary" dot>
            Confirmed
          </Badge>
          <Badge variant="warning" dot>
            Processing
          </Badge>
          <Badge variant="success" dot>
            Delivered
          </Badge>
          <Badge variant="danger" dot>
            Cancelled
          </Badge>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Alert title="Invoice numbering">Invoices will start at INV-2026-000001.</Alert>
          <Alert variant="success" title="Order confirmed" />
          <Alert variant="warning" title="Customer has no GSTIN">
            IGST will be charged based on the billing state.
          </Alert>
          <Alert variant="danger" title="Could not save">
            Discount cannot exceed the line amount.
          </Alert>
        </div>
      </Section>

      <Section title="Table">
        <Card>
          <CardHeader
            title="Products"
            description="3 products"
            actions={
              <Button size="sm">
                <Plus aria-hidden /> Add product
              </Button>
            }
          />
          <CardContent className="px-0 pb-0">
            <Table aria-label="Products">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <Checkbox aria-label="Select all" />
                  </TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead numeric>Price</TableHead>
                  <TableHead numeric>GST</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {PRODUCTS.map((p) => (
                  <TableRow key={p.sku}>
                    <TableCell>
                      <Checkbox aria-label={`Select ${p.name}`} />
                    </TableCell>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell className="font-mono text-caption text-muted-foreground">
                      {p.sku}
                    </TableCell>
                    <TableCell numeric>{p.price}</TableCell>
                    <TableCell numeric>{p.gst}</TableCell>
                    <TableCell>
                      <Badge variant={p.active ? "success" : "neutral"}>
                        {p.active ? "Active" : "Archived"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TableCell colSpan={3}>Total</TableCell>
                  <TableCell numeric>₹2,550.00</TableCell>
                  <TableCell colSpan={2} />
                </TableRow>
              </TableFooter>
            </Table>
          </CardContent>
        </Card>
      </Section>

      <Section title="Tabs">
        <Tabs defaultValue="orders">
          <TabsList aria-label="Customer">
            <TabsTrigger value="orders">Orders</TabsTrigger>
            <TabsTrigger value="invoices">Invoices</TabsTrigger>
            <TabsTrigger value="addresses">Addresses</TabsTrigger>
          </TabsList>
          <TabsContent value="orders">42 orders · ₹5.2L revenue</TabsContent>
          <TabsContent value="invoices">38 invoices</TabsContent>
          <TabsContent value="addresses">1 billing, 3 shipping</TabsContent>
        </Tabs>
      </Section>

      <Section title="Overlays">
        <div className="flex flex-wrap gap-3">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="secondary">Open dialog</Button>
            </DialogTrigger>
            <DialogContent
              title="Cancel order ORD-2026-000124?"
              description="The order will be marked cancelled. This can't be undone."
              size="sm"
              footer={
                <>
                  <DialogClose asChild>
                    <Button variant="secondary">Keep order</Button>
                  </DialogClose>
                  <DialogClose asChild>
                    <Button variant="danger" onClick={() => toast.success("Order cancelled")}>
                      Cancel order
                    </Button>
                  </DialogClose>
                </>
              }
            />
          </Dialog>
          <Drawer>
            <DrawerTrigger asChild>
              <Button variant="secondary">Open drawer</Button>
            </DrawerTrigger>
            <DrawerContent
              title="Filter orders"
              footer={<Button className="w-full sm:w-auto">Apply filters</Button>}
            >
              <div className="flex flex-col gap-4">
                <Field label="Status">
                  <Select
                    options={[
                      { value: "DRAFT", label: "Draft" },
                      { value: "CONFIRMED", label: "Confirmed" },
                    ]}
                  />
                </Field>
                <Field label="Customer">
                  <Input placeholder="Search customers…" />
                </Field>
              </div>
            </DrawerContent>
          </Drawer>
          <Button
            variant="secondary"
            onClick={() => toast.success("Invoice sent", "INV-2026-000001 emailed to ABC Traders")}
          >
            Success toast
          </Button>
          <Button
            variant="secondary"
            onClick={() => toast.error("Could not generate PDF", "Please try again.")}
          >
            Error toast
          </Button>
        </div>
      </Section>

      <Section title="Empty & loading states">
        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
            <EmptyState
              icon={<Package />}
              title="No products yet"
              description="Add your first product to start creating orders."
              action={
                <Button>
                  <Plus aria-hidden /> Add product
                </Button>
              }
            />
          </Card>
          <Card>
            <CardContent className="flex flex-col gap-3">
              <Skeleton className="h-5 w-1/3" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-9 w-28" />
            </CardContent>
          </Card>
        </div>
      </Section>
    </main>
  );
}
