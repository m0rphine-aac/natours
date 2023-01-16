import axios from 'axios';
import { showAlert } from './showAlert';

export const bookTour = async tourID => {
  const stripe = Stripe(
    'pk_test_51MQaAxSEP4GXSCetc2UWi4HB7It3wKcm3GWmABEVpjMYDgjsU7hqfsv2qXQnH9oCUwuHEgZVvtsoz4UzjhH9wagI00yJPQaINx'
  );
  try {
    // 1) Get checkout session from the server
    const session = await axios(`/api/v1/bookings/checkout-session/${tourID}`);

    // 2) Create checkout form and charge credit card
    await stripe.redirectToCheckout({
      sessionId: session.data.session.id,
    });
  } catch (err) {
    showAlert('error', err);
  }
};
