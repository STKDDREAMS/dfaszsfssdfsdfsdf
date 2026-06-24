// api/create-checkout-session.js
// Works as-is on Vercel. For Netlify Functions or AWS Lambda the request/
// response shape differs slightly (see notes at the bottom of this file).

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// This MUST mirror ITEMS_BY_ID from earlspade.html. Never trust prices sent
// from the browser — always re-look-up the price server-side, or anyone
// could open devtools and check out a $500 jacket for $1.
const ITEMS_BY_ID = {
  'sea-tidal-crewneck':        { name: 'Tidal Crewneck',        price: 112 },
  'sea-current-pocket-tee':    { name: 'Current Pocket Tee',    price: 68  },
  'sea-deep-pleated-trouser':  { name: 'Deep Pleated Trouser',  price: 152 },
  'sea-harbor-beanie':         { name: 'Harbor Beanie',         price: 44  },
  'sea-coral-knit-polo':       { name: 'Coral Knit Polo',       price: 98  },
  'sea-drift-chore-coat':      { name: 'Drift Chore Coat',      price: 218 },
  'sea-saltwash-tote':         { name: 'Saltwash Tote',         price: 42  },
  'sea-anchor-card-holder':    { name: 'Anchor Card Holder',    price: 58  },
  'cel-nebula-hoodie':         { name: 'Nebula Hoodie',         price: 138 },
  'cel-orbit-box-tee':         { name: 'Orbit Box Tee',         price: 72  },
  'cel-eclipse-cargo-pant':    { name: 'Eclipse Cargo Pant',    price: 162 },
  'cel-star-chart-cap':        { name: 'Star Chart Cap',        price: 48  },
  'cel-lunar-knit-crew':       { name: 'Lunar Knit Crew',       price: 176 },
  'cel-meteor-work-jacket':    { name: 'Meteor Work Jacket',    price: 255 },
  'cel-astral-long-sleeve':    { name: 'Astral Long Sleeve',    price: 78  },
  'cel-cosmos-socks':          { name: 'Cosmos Socks (2-Pack)', price: 26  },
};

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).end();

  try {
    const { cart } = req.body; // cart = { "sea-tidal-crewneck": 2, "cel-orbit-box-tee": 1 }
    if (!cart || typeof cart !== 'object' || Object.keys(cart).length === 0) {
      return res.status(400).json({ error: 'Cart is empty or malformed.' });
    }

    const line_items = [];
    for (const [id, qty] of Object.entries(cart)) {
      const item = ITEMS_BY_ID[id];
      const quantity = parseInt(qty, 10);
      if (!item || !Number.isInteger(quantity) || quantity <= 0 || quantity > 50) {
        return res.status(400).json({ error: `Invalid cart item: ${id}` });
      }
      line_items.push({
        price_data: {
          currency: 'usd',
          product_data: { name: item.name },
          unit_amount: Math.round(item.price * 100), // Stripe uses cents
        },
        quantity,
      });
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items,
      shipping_address_collection: { allowed_countries: ['US', 'CA'] },
      success_url: 'https://yourdomain.com/success?session_id={CHECKOUT_SESSION_ID}',
      cancel_url: 'https://yourdomain.com/?checkout=cancelled',
      // optional: track which cart this was server-side if you want it in webhooks
      metadata: { cart: JSON.stringify(cart) },
    });

    res.status(200).json({ url: session.url });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not create checkout session.' });
  }
};

/*
  NETLIFY FUNCTIONS version (exports.handler instead of module.exports,
  and JSON.parse(event.body) instead of req.body):

  exports.handler = async (event) => {
    const { cart } = JSON.parse(event.body);
    // ...same logic...
    return { statusCode: 200, body: JSON.stringify({ url: session.url }) };
  };
*/
