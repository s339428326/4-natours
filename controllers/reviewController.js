const Review = require('../models/reviewModel');
const handlerFactory = require('./handlerFactory');

exports.setUserTourIds = (req, res, next) => {
  if (!req.body.tour) req.body.tour = req.params.tourId;
  if (!req.body.user) req.body.user = req.user.id;
  next();
};

exports.getAllReview = handlerFactory.getAll(Review);
exports.getOneReview = handlerFactory.getOne(Review);
exports.createNewReview = handlerFactory.create(Review);
exports.patchReview = handlerFactory.patchOne(Review);
exports.deleteOenReview = handlerFactory.deleteOne(Review);
