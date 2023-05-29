const stripe = require('stripe')(process.env.STRIPE_SECRET_PUBLIC_API_KEY);
const Booking = require('../models/bookingModel');
const Tour = require('../models/toursModel');

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
    success_url: `${req.protocol}://${req.get('host')}/?tour=${
      req.params.tourId
    }&user=${req.user.id}&price=${tour.price}`, //首頁
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
            images: [`http://www.natours.dev/img/tours/${tour.imageCover}`],
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

exports.createBookingCheckout = catchAsync(async (req, res, next) => {
  //test using query fields
  const { tour, user, price } = req.query;

  if (!tour && !user && !price) return next();
  await Booking.create({ tour, user, price });

  res.redirect(req.originalUrl.split('?')[0]);
});

//admin controller
exports.getBooking = handlerFactory.getOne(Booking);
exports.getAllBookings = handlerFactory.getAll(Booking);
exports.createBooking = handlerFactory.create(Booking);
exports.patchBooking = handlerFactory.patchOne(Booking);
exports.deleteBooking = handlerFactory.deleteOne(Booking);
