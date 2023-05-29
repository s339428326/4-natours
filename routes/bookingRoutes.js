const express = require('express');

//controller
const authController = require('../controllers/authController');
const bookingController = require('../controllers/bookingController');

const router = express.Router();

router.use(authController.protect);
//不參考RESTful原則，這個路由只針對結帳

//checkout
router.get(
  '/checkout-session/:tourId',
  authController.protect,
  bookingController.getCheckoutSession
);

// /api/v1/booking

router.use(authController.restrictTo('admin', 'lead-guide'));

// CRUD
router
  .route('/')
  .get(bookingController.getAllBookings)
  .post(bookingController.createBooking);

router
  .route('/:id')
  .get(bookingController.getBooking)
  .patch(bookingController.patchBooking)
  .delete(bookingController.deleteBooking);

module.exports = router;
