const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const User = require('../models/userModel');
const handlerFactory = require('./handlerFactory');
const multer = require('multer');
const sharp = require('sharp');

const filterObj = (obj, ...deleteKeyArr) => {
  const newObj = {};
  Object.keys(obj).forEach((item) => {
    if (deleteKeyArr.includes(item)) {
      newObj[item] = obj[item];
    }
  });
  return newObj;
};

//multer upload setting var
//(多一步放入硬碟後讀取) :40 改用暫存來讀取
// const multerStorage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, 'public/img/users');
//   },
//   filename: (req, file, cb) => {
//     const ext = file.mimetype.split('/')[1];
//     cb(null, `user-${req.user.id}-${Date.now()}.${ext}`);
//   },
// });

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

//middleware 中加入 req.file 'photo'
exports.uploadUserPhoto = upload.single('photo');

//壓縮圖檔
exports.resizeImage = async (req, res, next) => {
  if (!req.file) return next();

  //user image 圖片命名 => user-user:id-Date.now()
  req.file.filename = `user-${req.user.id}-${Date.now()}`;

  await sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/users/${req.file.filename}`);

  next();
};

exports.getMe = (req, res, next) => {
  //getOne handler query 參數使用 req.params.id 這裡覆蓋成user.id使用
  req.params.id = req.user.id;
  next();
};

//role for admin
exports.getAllUsers = handlerFactory.getAll(User);
exports.getUser = handlerFactory.getOne(User);
exports.createUser = handlerFactory.create(User);
exports.patchUser = handlerFactory.patchOne(User);
exports.deleteUser = handlerFactory.deleteOne(User);

exports.updateOwnInfo = catchAsync(async (req, res, next) => {
  // console.log(req.file);
  // console.log(req.body);
  if (req.body.password || req.body.passwordConfirm)
    return next(new AppError('請使用 /forgetPassword 路由來更改密碼'), 401);

  // if (!req.body.email || !req.body.name)
  //   return next(new AppError('請確認是否 email 和 名稱是否填寫！'));

  const filterBody = filterObj(req.body, 'name', 'email');

  if (req.file) filterBody.photo = req.file.filename;

  const updateUser = await User.findByIdAndUpdate(req.user.id, filterBody, {
    new: true, //
    runValidators: true,
  }).select('-passwordChangedAt -__v');

  if (!updateUser)
    return next(new AppError('此用戶已不存在, 請重新登入！', 400));

  res.status(200).json({
    status: 'success',
    data: {
      user: updateUser,
    },
  });
});

exports.deleteOwnAccount = catchAsync(async (req, res, next) => {
  //發送驗證碼至信箱
  //等待

  await User.findByIdAndUpdate(req.user.id, { active: false });
  res.status(204).json({
    status: 'success',
    message: '已成功刪除用戶!',
  });
});
