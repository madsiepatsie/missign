const Stripe = require('stripe');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).end();

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const { amount, adData, paymentMethod } = req.body;

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: paymentMethod === 'ideal' ? ['ideal'] : ['card'],
      line_items: [{
        price_data: {
          currency: 'eur',
          product_data: {
            name: 'Missign — ' + adData.name,
            description: adData.duration_days + ' dag(en) op ' + adData.screenCount + ' schermen'
          },
          unit_amount: amount
        },
        quantity: 1
      }],
      mode: 'payment',
      success_url: 'https://missign-mfng.vercel.app/success.html?session_id={CHECKOUT_SESSION_ID}',
      failure_url: 'https://missign-mfng.vercel.app',
      metadata: {
        adData: JSON.stringify(adData)
      }
    });

    res.status(200).json({ url: session.url });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
