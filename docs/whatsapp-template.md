# WhatsApp invoice template

Sending invoices on WhatsApp uses the **WhatsApp Business Cloud API**. Meta only
lets a business start a conversation with a pre-approved _template_, so create
this one once in **WhatsApp Manager → Message templates**:

| Setting  | Value                                                              |
| -------- | ------------------------------------------------------------------ |
| Name     | `invoice_document` (or set `WHATSAPP_TEMPLATE_NAME`)               |
| Category | Utility                                                            |
| Language | English (`en`) (or set `WHATSAPP_TEMPLATE_LANGUAGE`)               |
| Header   | **Document**                                                       |
| Body     | `Hello {{1}}, please find your {{2}} for {{3}}. Thank you, {{4}}.` |

The app fills the variables in this order:

1. Customer name — `Sharma Traders`
2. Document — `invoice INV-2026-000001` or `order ORD-2026-000004`
3. Amount — `₹28,346.00`
4. Your business name — `ABC Distributors Pvt Ltd`

## Connecting

1. In [Meta for Developers](https://developers.facebook.com/), create an app with the
   **WhatsApp** product and add your business phone number (it can't also be used
   in the regular WhatsApp app).
2. Create a **System User** access token with `whatsapp_business_messaging`
   permission (tokens from the "API Setup" page expire after 24 hours).
3. Set in `.env.local` (and in production):

   ```
   WHATSAPP_ACCESS_TOKEN=...
   WHATSAPP_PHONE_NUMBER_ID=...   # from WhatsApp → API Setup
   ```

4. Restart the app. The Share menu's WhatsApp option then sends the PDF itself
   instead of opening WhatsApp with a link.

Meta charges per conversation; see their current pricing for India.
