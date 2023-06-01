const Tour = require('../models/toursModel');
const Booking = require('../models/bookingModel');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

exports.getOverView = async (req, res, next) => {
  const tours = await Tour.find();
  res.status(200).render('layout', {
    page: 'overview',
    title: 'overview',
    tours,
  });
};

exports.getTour = catchAsync(async (req, res, next) => {
  const { slug } = req.params;
  const tour = await Tour.findOne({ slug }).populate({ path: 'reviews' });

  if (!tour) {
    return next(new AppError('未找此旅遊行程', 404));
  }

  res.status(200).render('tours', { page: 'tour', title: tour.name, tour });
});

exports.getLogin = (req, res) => {
  res.status(200).render('layout', {
    page: 'login',
    title: 'overview',
  });
};

exports.getProfile = (req, res) => {
  res.status(200).render('layout', {
    page: 'profile',
    title: 'Profile',
  });
};

exports.getForgetPassword = (req, res) => {
  res.status(200).render('layout', {
    page: 'forgetPassword',
    title: 'Forget Password',
  });
};

exports.getResetPassword = (req, res) => {
  res.status(200).render('tours', {
    page: 'resetPassword',
    title: 'Reset Password',
  });
};

exports.alerts = (req, res, next) => {
  const { alert } = req.query;
  if (alert === 'true') res.locals.alert = '訂單付款成功';
  next();
};

exports.getMyTours = async (req, res) => {
  const ownBookings = await Booking.find({ user: req.user.id });

  const tourIDs = ownBookings.map((booking) => booking.tour);
  const tours = await Tour.find({ _id: { $in: tourIDs } });

  const { alert } = res.locals;
  console.log('getTours Message', alert);

  res.status(200).render('tours', {
    page: 'myBooking',
    title: 'My Booking',
    tours,
    alert: alert || '',
    test: 'test',
  });
};
