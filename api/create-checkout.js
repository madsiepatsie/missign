const Stripe = require('stripe');
const https = require('https');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).end();

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const { amount, adData, paymentMethod } = req.body;

  try {
    adData.status = 'pending';
    delete adData.screenCount;

    const body = JSON.stringify(adData);
    const hostname = 'oghquovomayveqmgdtgc.supabase.co';

    const adId = await new Promise((resolve, reject) => {
      const options = {
        hostname: hostname,
        path: '/rest/v1/ads',
        method: 'POST',
        headers: {
          'apikey': process.env.SUPABASE_SERVICE_KEY,
          'Authorization': 'Bearer ' + process.env.SUPABASE_SERVICE_KEY,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation',
          'Content-Length': Buffer.byteLength(body)
        }
      };

      const req2 = https.request(options, (r) => {
        let data = '';
        r.on('data', chunk => data += chunk);
        r.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            resolve(parsed[0].id);
          } catch(e) { reject(new Error('Parse error: ' + data)); }
        });
      });

      req2.on('error', reject);
      req2.write(body);
      req2.end();
    });

    const session = await stripe.checkout.sessions.create({
      payment_method_types: paymentMethod === 'ideal' ? ['ideal'] : ['card'],
      line_items: [{
        price_data: {
          currency: 'eur',
          product_data: {
            name: 'Missign — ' + adData.name,
            description: adData.duration_days + ' dag(en)'
          },
          unit_amount: amount
        },
        quantity: 1
      }],
      mode: 'payment',
      success_url: 'https://missign-mfng.vercel.app/success.html?session_id={CHECKOUT_SESSION_ID}',
      cancel_url: 'https://missign-mfng.vercel.app',
      metadata: { ad_id: String(adId) }
    });

    res.status(200).json({ url: session.url });
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
};
