import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Showcase } from "./Showcase";

export const metadata: Metadata = { title: "Design system" };

/** Living reference for the component library. Development only. */
export default function DesignPage() {
  if (process.env.NODE_ENV === "production") notFound();
  return <Showcase />;
}
