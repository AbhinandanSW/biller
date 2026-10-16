# Invoice SaaS

A multi-organization billing application for products, customers, orders, and GST invoices. The UI is built with Next.js App Router and React; Supabase provides authentication, Postgres, row-level security, storage, and database workflows.

## Start here

- [Developer guide](docs/developer-guide.md) — architecture, request flows, diagrams, domain behavior, database, and module map.
- [WhatsApp template setup](docs/whatsapp-template.md) — required Meta template configuration.

## Development

```bash
pnpm install
pnpm dev
```

Configure Supabase and optional email/WhatsApp providers using `.env.example`. To run the local database, use `pnpm db:start`; reset it with `pnpm db:reset`.

Useful commands: `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm build`.
