const express = require('express');

const router = express.Router();

const authController = require('../controllers/authController');
const viewController = require('../controllers/viewController');

router.use(viewController.alerts);

//test
router.get('/', authController.isLogin, viewController.getOverView);

router.get('/my-tours', authController.protect, viewController.getMyTours);

router.get('/login', authController.isLogin, viewController.getLogin);
router.get('/tours/:slug', authController.isLogin, viewController.getTour);
router.get('/profile', authController.protect, viewController.getProfile);
router.get('/forgetPassword', viewController.getForgetPassword);
router.get('/resetPassword/:token', viewController.getResetPassword);

module.exports = router;
