const Stripe = require('stripe');

module.exports = async (req, res) => {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const { session_id } = req.query;

  try {
    const session = await stripe.checkout.sessions.retrieve(session_id);
    if (session.payment_status !== 'paid') {
      return res.status(400).json({ success: false, error: 'Not paid' });
    }

    const adData = JSON.parse(session.metadata.adData);

    const response = await fetch(process.env.SUPABASE_URL + '/rest/v1/ads', {
      method: 'POST',
      headers: {
        'apikey': process.env.SUPABASE_SERVICE_KEY,
        'Authorization': 'Bearer ' + process.env.SUPABASE_SERVICE_KEY,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify(adData)
    });

    if (response.ok || response.status === 201) {
      res.status(200).json({ success: true });
    } else {
      const t = await response.text();
      res.status(500).json({ success: false, error: t });
    }
  } catch(e) {
    res.status(500).json({ success: false, error: e.message });
  }
};
