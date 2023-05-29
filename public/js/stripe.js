import axios from 'axios';

export const bookTour = async (tourId) => {
  const domain = 'http://127.0.0.1:6300';

  try {
    const res = await axios.get(
      `${domain}/api/v1/booking/checkout-session/${tourId}`
    );
    console.log(res);
    location.assign(res.data.session.url);

    // await stripe.redirectToCheckout({
    //   sessionId: res.data.session.id,
    // });
  } catch (err) {
    console.log(err.response.data.message);
  }
};
