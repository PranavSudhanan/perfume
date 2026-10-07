# Bespoke Perfume Store

A complete e-commerce site for a custom perfume brand: a storefront with a build-your-own-perfume
experience, and an admin panel that controls the whole site — products, banners, pages, menus,
theme, pricing rules and orders — without touching code.

Built with Next.js 16 (App Router), Postgres (Neon) via Drizzle ORM, and Tailwind CSS 4.

## What's included

**Storefront**

- Home page and content pages assembled from editable sections (hero banners, product grids, FAQs…)
- Shop with collection / audience / scent-family filters, search and sorting
- Product pages with sizes, stock, note pyramid and moderated reviews
- **Perfume builder** (`/create`): customers pick a size, concentration and notes, name the bottle,
  and watch the bottle preview and scent profile update live
- Bag, discount codes, checkout (guest or signed-in), order confirmation and order tracking
- Customer accounts with order history and saved address
- Payments: cash on delivery, and Razorpay once you add keys

**Admin panel** (`/admin`)

| Area | What you can do |
| --- | --- |
| Dashboard | Revenue, orders, low-stock alerts |
| Orders | Update status and payment, add tracking, see the blend sheet for custom perfumes |
| Products / Collections | Full catalogue management with images, sizes, prices and stock |
| Perfume builder | Define the steps, the options in each step, prices and bottle tints |
| Pages & banners | Add, edit, reorder and hide sections on any page; create new pages |
| Menus & footer | Announcement bar, header menu, footer columns |
| Theme | Presets, colours, fonts, corner style, layout — with live preview |
| Discount codes, Reviews, Customers, Inbox, Media library, Settings | As named |

## Run it locally

Requires Node.js 20.9 or newer.

```bash
npm install
cp .env.example .env        # then fill in AUTH_SECRET and ADMIN_PASSWORD
```

You need a Postgres database. Pick one:

- **No account needed:** run `npm run db:local` in a second terminal and leave it running. It starts
  an embedded Postgres on port 5433, which is what `.env.example` points at.
- **Neon:** paste your Neon connection string into `DATABASE_URL` in `.env`.

Then:

```bash
npm run db:setup            # creates tables, loads demo content, creates the admin account
npm run dev
```

Open http://localhost:3000 for the store and http://localhost:3000/admin for the admin panel.
Sign in with `ADMIN_EMAIL` / `ADMIN_PASSWORD` from your `.env`.

## Deploy to Vercel with Neon

1. **Create the database.** In [Neon](https://neon.tech), create a project. Open **Connect**, turn on
   **Connection pooling**, and copy the connection string (its host contains `-pooler`).
2. **Push this folder to a Git repository** (GitHub, GitLab or Bitbucket).
3. **Import the repository in Vercel** and add these environment variables before deploying:

   | Variable | Value |
   | --- | --- |
   | `DATABASE_URL` | The pooled Neon connection string |
   | `AUTH_SECRET` | A long random string — `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"` |
   | `ADMIN_EMAIL` | The email you will sign in to `/admin` with |
   | `ADMIN_PASSWORD` | A strong password, at least 8 characters |
   | `NEXT_PUBLIC_SITE_URL` | Your live URL, e.g. `https://www.yourbrand.com` (optional; defaults to the Vercel URL) |

4. **Deploy.** The build runs `npm run db:setup` first, which creates the tables, loads the demo
   content into an empty database and creates your admin account. Nothing else to run.
5. Sign in at `/admin`, then replace the demo content: store name and contact details under
   **Settings**, colours and fonts under **Theme**, products, and the text on each page.

For the best speed, choose the same region for the Neon project and the Vercel project.

Later deployments re-run `db:setup`; it only applies new migrations and never overwrites your content.

### Online payments (optional)

Cash on delivery works out of the box. To accept cards and UPI:

1. Create a [Razorpay](https://razorpay.com) account and generate API keys.
2. Add `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` to Vercel's environment variables and redeploy.
3. Recommended: in Razorpay, add a webhook for the `payment.captured` event pointing to
   `https://your-site/api/razorpay/webhook`, and set the same secret as `RAZORPAY_WEBHOOK_SECRET`.
   This marks an order paid even if the customer closes the tab before returning to the site.

Start with Razorpay **test** keys and place a test order before switching to live keys.

### Emails and text messages to customers

The store sends three kinds of email, all through the one mail connection described below:

| Email | Sent when |
| --- | --- |
| **Order confirmation** | An order is placed (cash on delivery) or paid (online) |
| **Shipping update** | You set an order's status to *Shipped* (includes the tracking number and link), and again when you set it to *Delivered* |
| **Password reset** | Someone uses "Forgot your password?" on the sign-in page |

When an order is placed the customer also gets:

- **A confirmation popup** on screen — always, nothing to set up.
- **A text message (SMS)** with the order number and a tracking link — once you connect an SMS service.

The popup only says "email sent" or "text sent" when that message really went out. Each order in
the admin lists every message sent for it, any error, and buttons to send them again (useful after
adding a tracking link, or fixing a failed delivery).

**Password reset** works for customers and admins alike. The emailed link works once and expires
after 60 minutes; using it signs the person in and signs out every other device. Until a mail
service is connected the "forgot password" page says so and points to your contact email instead,
and `npm run admin:reset` remains the way to recover the admin account.

**Email** is sent over SMTP, so almost any mail service works. Add these to Vercel's environment
variables and redeploy:

| Variable | Example |
| --- | --- |
| `SMTP_HOST` | `smtp.gmail.com` |
| `SMTP_PORT` | `465` |
| `SMTP_USER` | `orders@yourbrand.com` |
| `SMTP_PASS` | the mailbox password, or for Gmail an [app password](https://myaccount.google.com/apppasswords) |
| `EMAIL_FROM` | `Aurelle <orders@yourbrand.com>` (optional) |

Then open Admin → Settings → Checkout & notifications and press **Send me a test email**.
Gmail allows about 500 emails a day; for more, use a transactional service such as Brevo, Resend or
Amazon SES with the SMTP details they give you.

**SMS** needs one provider:

- **Fast2SMS** (Indian numbers): set `FAST2SMS_API_KEY`. Messages go through its "Quick SMS"
  route, which needs no DLT registration but costs more per message than a DLT route.
- **Twilio** (any country): set `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN` and `TWILIO_FROM`
  (your Twilio number, or a Messaging Service id starting with `MG`).

The wording of the text message, an extra line for the confirmation email, and on/off switches for
the confirmation email, shipping emails and text message are under Admin → Settings → Checkout &
notifications.

Locally, `NOTIFICATIONS_PREVIEW="true"` in `.env` writes each email and text to `.data/outbox`
instead of sending it, so you can open the email in a browser. It is ignored in production.

## Good to know

- **Demo photos** are free stock images loaded from Unsplash's servers, chosen to show no
  brand names. They are placeholders: upload your own product photography from the admin
  (Products → Images, and the image fields in Pages & banners). The bottle in the perfume
  builder stays an illustration on purpose — it recolours and relabels live as customers choose.
- **Images** uploaded in the admin are compressed in the browser and stored in Postgres, so no
  storage service is needed. This suits a catalogue of a few hundred images on Neon's free tier.
- **The store itself is not emailed.** Customers get the emails described above, but there is no
  new-order alert to the shop owner; new orders and contact messages appear in the admin.
- **Changing a password signs out other devices.** After a password change or reset, sessions
  started before it stop working.
- **Order limit:** one email address or phone number can place at most 5 orders in 15 minutes, so
  the store can't be used to flood someone with confirmation messages.
- **Address dropdowns:** Country, State and City are dropdowns at checkout and in the customer's
  account. Customers can only pick countries listed under Admin → Settings → Checkout &
  notifications → "Countries you deliver to" (India by default), and the server refuses any other.
  The city dropdown is searchable, and a customer whose town isn't listed can type it in. For the
  few countries with no state or city list, those fields become ordinary text boxes.
- **Location data** (250 countries, about 5,300 states and 152,000 cities) is stored as small
  files in `public/geo`, loaded only for the country a customer picks. It comes from the
  [Countries States Cities Database](https://github.com/dr5hn/countries-states-cities-database)
  under the Open Database License; `public/geo/ATTRIBUTION.txt` carries the required credit.
  `scripts/gen-geo.mjs` explains how to refresh it.
- **Forgot the admin password?** Set a new `ADMIN_PASSWORD`, then run `npm run admin:reset`
  (locally, with `DATABASE_URL` pointing at the live database).
- **Prices** are stored in the currency's minor unit (paise). Change currency under
  Settings → Store details; this relabels prices, it does not convert them.
- Storefront data is cached and refreshed instantly whenever you save something in the admin.
  Changes made directly in the database appear within five minutes.
- The privacy policy and terms pages contain placeholder text — replace them before going live.

## Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the development server |
| `npm run build` | Set up the database, then build for production |
| `npm run db:local` | Run an embedded Postgres for local development |
| `npm run db:setup` | Apply migrations, seed an empty database, ensure an admin exists |
| `npm run db:generate` | Create a migration after editing `src/db/schema.ts` |
| `npm run admin:reset` | Reset the admin password from `ADMIN_PASSWORD` |
| `npm run lint` / `npm run typecheck` | Code checks |

## Project layout

```
src/app/(store)        Storefront pages
src/app/admin          Admin panel
src/app/api            Image uploads, media serving, Razorpay webhook
src/components         UI — sections/ (page sections), store/, admin/
src/db                 Database schema and connection
src/lib                Business logic: pricing, auth, settings, server actions
scripts                Database setup, demo content, artwork and location-data generators
drizzle                SQL migrations
```

To add a new kind of page section: describe its fields in `src/lib/sections.ts` and add its
component to `src/components/sections/index.tsx`. The admin editor picks it up automatically.
