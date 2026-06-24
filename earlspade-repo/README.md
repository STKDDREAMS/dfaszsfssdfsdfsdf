# earlspade

A single-page storefront (`index.html`) with a built-in cart, plus a small
serverless function (`api/create-checkout-session.js`) that creates a Stripe
Checkout Session for the cart.

## What's in this repo

```
index.html                       <- the entire storefront (HTML/CSS/JS, one file)
api/create-checkout-session.js   <- serverless function for Stripe Checkout
package.json                     <- dependency (stripe) for the function above
```

## Hosting the site (GitHub Pages — free, static only)

GitHub Pages can serve `index.html` directly, but it **cannot run the
`api/` function** — Pages is static-files-only, no server-side code.

1. Push this repo to GitHub.
2. Repo → **Settings → Pages**.
3. Under "Build and deployment", set **Source: Deploy from a branch**.
4. Branch: `main`, folder: `/ (root)`. Save.
5. GitHub gives you a URL like `https://yourusername.github.io/earlspade/`
   within a minute or two.
6. (Optional) **Settings → Pages → Custom domain** to point your own domain
   at it — add a `CNAME` record at your registrar pointing to
   `yourusername.github.io`, then enter your domain in that field.

At this point the storefront, cart, and product browsing all work. The
**Checkout button will fail** until the API function is hosted somewhere
that runs server code (see below) — GitHub Pages alone can't do that part.

## Hosting the checkout function (Vercel — free tier works)

The `api/` folder is already in Vercel's expected format, so this is a
direct connect, no extra config:

1. Go to vercel.com → **Add New Project** → import this same GitHub repo.
2. Vercel auto-detects `index.html` as the site and `api/*.js` as
   serverless functions. Deploy.
3. **Settings → Environment Variables** → add `STRIPE_SECRET_KEY` with your
   Stripe secret key (`sk_test_...` while testing, `sk_live_...` later).
4. Redeploy after adding the env var (Vercel needs a fresh deploy to pick
   it up).

Once deployed on Vercel, **use the Vercel URL as your live site** instead
of GitHub Pages — Vercel serves both `index.html` and `/api/...` together
from one place, so the Checkout button works immediately with no CORS
setup needed. GitHub Pages is then just a free mirror/staging copy if you
want one, but isn't required once Vercel is live.

## Before going live

- Test with Stripe's test card `4242 4242 4242 4242` (any future expiry,
  any CVC) using your `sk_test_...` key first.
- Set up a webhook (Stripe Dashboard → Developers → Webhooks) listening
  for `checkout.session.completed` so you get tamper-proof order records,
  not just the success-page redirect.
- Swap `sk_test_...` for `sk_live_...` in Vercel's environment variables
  only once a test purchase has gone through successfully end to end.
