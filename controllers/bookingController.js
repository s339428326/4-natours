const stripe = require('stripe')(process.env.STRIPE_SECRET_PUBLIC_API_KEY);
const Booking = require('../models/bookingModel');
const Tour = require('../models/toursModel');
const User = require('../models/userModel');

const handlerFactory = require('../controllers/handlerFactory');
const catchAsync = require('../utils/catchAsync');
// const handlerFactory = require('./handlerFactory');
const AppError = require('../utils/appError');

exports.getCheckoutSession = catchAsync(async (req, res, next) => {
  const tour = await Tour.findById(req.params.tourId);
  if (!tour) return next(new AppError('此旅遊不存在', 404));

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    //test
    // success_url: `${req.protocol}://${req.get('host')}/?tour=${
    //   req.params.tourId
    // }&user=${req.user.id}&price=${tour.price}`,
    success_url: `${req.protocol}://${req.get('host')}/my-tours`,
    cancel_url: `${req.protocol}://${req.get('host')}/tours/${tour.slug}`,
    customer_email: req.user.email,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: 'usd',
          unit_amount: tour.price * 100,
          product_data: {
            name: `${tour.name} Tour`,
            description: tour.summary,
            images: [
              `${req.protocol}://${req.get('host')}/img/tours/${
                tour.imageCover
              }`,
            ],
          },
        },
      },
    ],
    client_reference_id: req.params.tourId,
  });

  //test
  res.status(200).json({
    status: 'success',
    session,
  });
});

// exports.createBookingCheckout = catchAsync(async (req, res, next) => {
//   //test using query fields
//   const { tour, user, price } = req.query;

//   if (!tour && !user && !price) return next();
//   await Booking.create({ tour, user, price });

//   res.redirect(req.originalUrl.split('?')[0]);
// });

const createBookingCheckout = async (session) => {
  const tour = session.client_reference_id;
  const user = await User.findOne({ email: session.customer_email }).id;
  const price = session.line_items[0].price_data.unit_amount / 100;

  await Booking.create({ tour, user, price });
};

//admin controller
exports.webhookCheckout = (req, res, next) => {
  const sig = req.headers['stripe-signature'];

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (error) {
    res.status(404).send(`[Error] Webhook:${error.message}`);
  }

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed':
      createBookingCheckout(event.data.object);
      break;
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.status(200).json({ received: true });
};
exports.getBooking = handlerFactory.getOne(Booking);
exports.getAllBookings = handlerFactory.getAll(Booking);
exports.createBooking = handlerFactory.create(Booking);
exports.patchBooking = handlerFactory.patchOne(Booking);
exports.deleteBooking = handlerFactory.deleteOne(Booking);
