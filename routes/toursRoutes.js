const express = require('express');

//controller
const tourController = require('../controllers/tourController');
const authController = require('../controllers/authController');
//anther Route
const reviewRouter = require('./reviewRoutes');
//mounting Router
const router = express.Router();

//重新被指向到reviewRoute檔案, 所以到review路由位址會被指定為'/'
router.use('/:tourId/reviews', reviewRouter);

//Tour
router
  .route('/top5-cheap')
  .get(tourController.topTours, tourController.getAllTour);

router.route('/star').get(tourController.getTourStats);

router
  .route('/monthly-plan/:year')
  .get(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide', 'guide'),
    tourController.getMonthlyPlan
  );

router
  .route('/tours-within/:distance/center/:latlng/unit/:unit')
  .get(tourController.getTourWithin);

router.route('/distances/:latlng/unit/:unit').get(tourController.getDistances);

router
  .route('/')
  .get(tourController.getAllTour)
  .post(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.createTour
  );

router
  .route('/:id')
  .get(tourController.getOneTour)
  .patch(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.uploadTourPhoto,
    // tourController.uploadImageCover,
    // tourController.uploadImages,
    tourController.resizeImage,
    tourController.patchTour
  )
  .delete(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.deleteTour
  );

module.exports = router;
