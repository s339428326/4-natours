// review, rating, createAt, ref to tour,ref to user
const mongoose = require('mongoose');
const Tour = require('./toursModel');

const reviewSchema = new mongoose.Schema(
  {
    review: {
      type: String,
      trim: true,
      require: [true, '評論不可以為空白'],
    },
    rating: {
      type: Number,
      min: [1, '最低評分為1'],
      max: [5, '最高評分為5'],
    },
    createAt: {
      type: Date,
      default: Date.now(),
    },
    tour: {
      type: mongoose.Schema.ObjectId,
      ref: 'Tour',
      require: [true, '一則評論(review)必須有旅行(tour)存在'],
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      require: [true, '一則評論(review)必須有用戶(user)存在'],
    },
  },
  {
    // strict: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

//tour與user同時設為唯一，可以達成user只能在一個tour留言一次
reviewSchema.index({ tour: 1, user: 1 }, { unique: true });

reviewSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'user',
    select: 'name photo',
  });

  next();
});

//statics:對Model新增類似：find, findById... 等，客製方法 與 method 不同在於此方法只用於新增整個集合或資料庫進行交互的方法(故可以使用aggregate)
reviewSchema.statics.calcAverageRatings = async function (tourId) {
  const stats = await this.aggregate([
    {
      //篩選符合條件的資料(review中有)
      $match: { tour: tourId },
    },
    {
      $group: {
        _id: '$tour',
        nRating: { $sum: 1 },
        ratting: { $avg: '$ratting' },
      },
    },
  ]);

  if (stats.length > 0) {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: stats[0].nRating,
      ratingsAverage: stats[0].ratting,
    });
  } else {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: 0,
      ratingsAverage: 0,
    });
  }
};

reviewSchema.post('save', function () {
  //Ex:Review.findById(id)
  //-> this.calcAverageRatings(this.tour);
  //Error => this 指向是當前的review文件所以不會有cal

  //採用this.constructor透過this指向constructor等同於使用Model同樣效果。
  this.constructor.calcAverageRatings(this.tour);
});

reviewSchema.post(/^findOneAnd/, async (doc) => {
  await doc.constructor.calcAverageRatings(doc.tour);
});

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
