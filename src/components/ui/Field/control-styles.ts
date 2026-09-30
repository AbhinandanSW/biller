/** Shared look for text-like controls (Input, Textarea, Select trigger). */
export const controlClassName = [
  "w-full rounded-md border border-border-strong bg-surface text-body text-foreground shadow-card",
  "placeholder:text-muted-foreground",
  "transition-colors hover:border-muted-foreground/60",
  "focus-visible:border-ring focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-ring/30",
  "disabled:cursor-not-allowed disabled:bg-surface-muted disabled:opacity-70",
  "aria-invalid:border-danger aria-invalid:focus-visible:outline-danger/30",
].join(" ");
