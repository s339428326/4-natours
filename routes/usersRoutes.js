//nodeJs
const express = require('express');

const userController = require('../controllers/userController');
const authController = require('../controllers/authController');

//mounting Router
const router = express.Router();

//auth
router.post('/singup', authController.singUp);
router.post('/login', authController.login);
router.get('/logout', authController.logout);

//forget password(Not login) send url(/resetPassword/:token) to user email
router.post('/forgetPassword', authController.forgetPassword);

//change password routerrestrictTo
router.post('/resetPassword/:token', authController.resetPassword);

router.use(authController.protect);

//Login change password
router.patch('/updatePassword', authController.updatePassword);

//user update own info
router.patch(
  '/updateOwnInfo',
  userController.uploadUserPhoto,
  userController.resizeImage,
  userController.updateOwnInfo
);

//user delete own Account
router.delete('/deleteOwnAccount', userController.deleteOwnAccount);

//me point
router.get('/me', userController.getMe, userController.getUser);

router.use(authController.restrictTo('admin'));

//user
router
  .route('/')
  .get(userController.getAllUsers)
  .post(userController.createUser);

router
  .route('/:id')
  .get(userController.getUser)
  .patch(userController.patchUser)
  .delete(userController.deleteUser);

module.exports = router;
