const express = require('express');

//controller
const authController = require('../controllers/authController');
const reviewController = require('../controllers/reviewController');

//mounting Router
//mergeParams => 每一個Router的 :id 動態參數預設不會互相取得
//因為 tour的review 路由 若想要將/api/v1/tour/:id/reviews這個路由程式碼， 分類到reviewRoute會導致:id無法被看到
const router = express.Router({ mergeParams: true });

router
  .route('/')
  .post(
    authController.protect,
    authController.restrictTo('user'),
    reviewController.setUserTourIds,
    reviewController.createNewReview
  )
  .get(reviewController.getAllReview);

router
  .route('/:id')
  .get(reviewController.getOneReview)
  .patch(
    authController.protect,
    authController.restrictTo('user', 'admin'),
    reviewController.patchReview
  )
  .delete(
    authController.protect,
    authController.restrictTo('user', 'admin'),
    reviewController.deleteOenReview
  );

module.exports = router;
