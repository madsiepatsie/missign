const Stripe = require('stripe');
const https = require('https');

module.exports = async (req, res) => {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const { session_id } = req.query;

  try {
    const session = await stripe.checkout.sessions.retrieve(session_id);
    if (session.payment_status !== 'paid') {
      return res.status(400).json({ success: false, error: 'Not paid' });
    }

    const adId = session.metadata.ad_id;
    const body = JSON.stringify({ status: 'active' });
    const url = new URL(process.env.SUPABASE_URL + '/rest/v1/ads?id=eq.' + adId);

    await new Promise((resolve, reject) => {
      const options = {
        hostname: url.hostname,
        path: url.pathname + url.search,
        method: 'PATCH',
        headers: {
          'apikey': process.env.SUPABASE_SERVICE_KEY,
          'Authorization': 'Bearer ' + process.env.SUPABASE_SERVICE_KEY,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(body)
        }
      };

      const req2 = https.request(options, (r) => {
        let data = '';
        r.on('data', chunk => data += chunk);
        r.on('end', () => resolve(data));
      });

      req2.on('error', reject);
      req2.write(body);
      req2.end();
    });

    res.status(200).json({ success: true });
  } catch(e) {
    res.status(500).json({ success: false, error: e.message });
  }
};
