const multer = require('multer');
const sharp = require('sharp');

const Tour = require('../models/toursModel');
const AppError = require('../utils/appError');

const catchAsync = require('../utils/catchAsync');
const handlerFactory = require('./handlerFactory');

exports.getAllTour = handlerFactory.getAll(Tour);
exports.getOneTour = handlerFactory.getOne(Tour, { path: 'reviews' });
exports.createTour = handlerFactory.create(Tour);
exports.patchTour = handlerFactory.patchOne(Tour);
exports.deleteTour = handlerFactory.deleteOne(Tour);

const multerFilter = (req, file, cb) => {
  //filter Not image mimetype
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new AppError('此檔案副檔名不支援，請重新上傳！'), false);
  }
};

//使用暫存來記錄image
const multerStorage = multer.memoryStorage();

//multer setting
const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});

//如果要設定多個上傳images需要用fields
//middleware 中會加入 req.files
exports.uploadTourPhoto = upload.fields([
  {
    name: 'imageCover', //form-data key name
    maxCount: 1, //最大上傳數量
  },
  {
    name: 'images',
    maxCount: 3,
  },
]);

//
exports.uploadImageCover = upload.single('imageCover');
//
exports.uploadImages = upload.array('images');

exports.resizeImage = (req, res, next) => {
  if (!req.files.images || !req.files.imageCover) return next();
  // console.log('message: ', req.files);

  //sharp setting
  const sharpTourImage = async (buffer, imageName) => {
    await sharp(buffer)
      .resize(2000, 1333)
      .toFormat('jpeg')
      .jpeg({ quality: 90 })
      .toFile(`public/img/tours/${imageName}`);
  };

  const coverImage = req.files.imageCover[0];

  coverImage.fieldname = `tour-${coverImage.originalname.split('.')[0]}-cover-${
    req.url.split('/')[1]
  }-${Date.now()}`;

  sharpTourImage(coverImage.buffer, coverImage.fieldname);
  //
  req.body.imageCover = coverImage.fieldname;

  req.body.images = [];

  req.files.images.forEach((image, index) => {
    image.fieldname = `tour-${image.originalname.split('.')[0]}-${index + 1}-${
      req.url.split('/')[1]
    }-${Date.now()}`;

    sharpTourImage(image.buffer, image.fieldname);
    //
    req.body.images.push(image.fieldname);
  });

  next();
};

//Top 5 recommend higher rating and cheaper price Tours
exports.topTours = async (req, res, next) => {
  //change send req
  req.query.limit = '5';
  req.query.sort = '-ratingAverage,price';
  req.query.fields = 'name,price,ratingAverage,summary,difficulty';
  next();
};

//get Tours calc.star
exports.getTourStats = catchAsync(async (req, res, next) => {
  const stats = await Tour.aggregate([
    {
      $match: { ratingsAverage: { $gte: 4.5 } },
    },
    {
      $group: {
        _id: '$difficulty',
        numTours: { $sum: 1 },
        avgRating: { $avg: '$ratingsAverage' },
        avgPrice: { $avg: '$price' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' },
      },
    },
  ]);

  res.status(200).json({
    status: 'success',
    results: stats.length,
    data: {
      stats,
    },
  });
});

//calc.each year Tours Time
exports.getMonthlyPlan = catchAsync(async (req, res, next) => {
  const year = parseInt(req.params?.year, 10) || 2021;
  const stats = await Tour.aggregate([
    {
      $unwind: '$startDates',
    },
    {
      $match: {
        startDates: {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`),
        },
      },
    },
    {
      $group: {
        _id: { $month: '$startDates' },
        toursQuantity: { $sum: 1 },
        tours: {
          $push: {
            name: '$name',
            tourStartAt: '$startDates',
          },
        },
      },
    },
    {
      $addFields: { month: '$_id' },
    },
    {
      $sort: { toursQuantity: -1 },
    },
    {
      $limit: 12,
    },
  ]);

  res.status(200).json({
    status: 'success',
    result: stats.length,
    data: {
      stats,
    },
  });
});

// /tours-within/:distance/center/:latlng/unit/:unit'
// /tours-within/145/center/22.5860764,120.3658793/unit/mi'
exports.getTourWithin = catchAsync(async (req, res, next) => {
  const { distance, latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');

  //計算
  const radius = unit === 'mi' ? distance / 3963.2 : distance / 6378.1;

  if (!lat || !lng) {
    return next(new AppError('請提供地理位置(緯度，經度)', 400));
  }

  const tours = await Tour.find({
    startLocation: { $geoWithin: { $centerSphere: [[lng, lat], radius] } },
  });

  res.status(200).json({
    status: 'success',
    results: tours.length,
    data: { tours },
  });
});

exports.getDistances = catchAsync(async (req, res, next) => {
  const { latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');
  //mi(英里) 1 公尺,米(m) = 0.00062137英里
  const unitConversionNumber = unit === 'mi' ? 0.00062137 : 0.001;

  if (!lat || !lng) {
    return next(new AppError('請提供地理位置(緯度，經度)', 400));
  }

  const distances = await Tour.aggregate([
    {
      $geoNear: {
        near: {
          type: 'Point',
          //轉成數字型別
          coordinates: [lng * 1, lat * 1],
        },
        distanceField: 'distance',
        distanceMultiplier: unitConversionNumber, // 乘上
      },
    },
    {
      $project: {
        distance: 1,
        name: 1,
      },
    },
  ]);

  res.status(200).json({
    status: 'success',
    results: distances.length,
    data: distances,
  });
});
