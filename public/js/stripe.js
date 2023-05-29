import axios from 'axios';

export const bookTour = async (tourId) => {
  try {
    const res = await axios.get(`/api/v1/booking/checkout-session/${tourId}`);
    location.assign(res.data.session.url);

    // await stripe.redirectToCheckout({
    //   sessionId: res.data.session.id,
    // });
  } catch (err) {
    console.log(err.response.data.message);
  }
};
