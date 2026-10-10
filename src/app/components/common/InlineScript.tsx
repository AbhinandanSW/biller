"use client";

/**
 * A script that runs while the browser parses the server HTML, before first
 * paint. On the client it renders as inert text/plain, which keeps React from
 * warning about <script> tags (see Next.js "Preventing flash before hydration").
 */
export function InlineScript({ html }: { html: string }) {
  return (
    <script
      type={typeof window === "undefined" ? "text/javascript" : "text/plain"}
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
