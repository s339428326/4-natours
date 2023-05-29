const crypto = require('crypto');
const { promisify } = require('util');
//3-rd plugin
const jwt = require('jsonwebtoken');

const User = require('../models/userModel');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const Email = require('../utils/email');
// const sendEmail = require('../utils/email');

//確認JWT Token 簽名是否正確
const singToken = (id) =>
  jwt.sign(
    { id }, //jwt encode data
    process.env.JWT_SECRET, //
    {
      expiresIn: process.env.JWT_EXPIRES_IN, //
    }
  );

const sendJWTTokenToClient = (user, statusCode, res, userBrowserAgent) => {
  const token = singToken(user._id);
  const totalMilliSecondsPerDay = 24 * 60 * 60 * 1000;
  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * totalMilliSecondsPerDay
    ),
    //瀏覽器(client端)不能使用任何形式進行修改EX:跨站腳本攻擊(Cross-Site Scripting, XSS)
    httpOnly: true,
  };
  //secure = true(只用在加密傳送，可以暫時認為只能在https上進行)
  if (
    process.env.NODE_ENV === 'production' &&
    !userBrowserAgent?.startsWith('Mozilla')
  ) {
    cookieOptions.secure = true;
  }

  //cookie(name, value, [,options])
  //jwt client使用cookie 進行操作憑證
  res.cookie('jwt', token, cookieOptions);

  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user,
    },
  });
};

exports.singUp = catchAsync(async (req, res, next) => {
  const { name, email, password, passwordConfirm } = req.body;
  const newUser = await User.create({
    name,
    email,
    password,
    passwordConfirm,
  });

  //url
  const url = `${req.protocol}://${req.get('host')}/profile`;

  await new Email(newUser, url).sendWelcome();

  //未被建立返回 客製 Error
  if (!newUser) return next(new AppError('建立賬戶失敗 ！', 403));
  //創建後登入
  sendJWTTokenToClient(newUser, 201, res);
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  //case
  //1.response no send email or password.
  if (!email || !password) {
    return next(new AppError('登入失敗！， 請從新確認 email 或 password'), 400);
  }
  console.log(password);
  //2.確認是否登出或密碼是否正確
  //讓password顯示於登入
  console.log(email);
  const user = await User.findOne({ email }).select(
    '+password +loginCount +loginTime'
  );

  if (!user) return next(new AppError('請重新確認信箱與密碼'), 404);

  //解密bcrypt並比對密碼是否正確(correctPassword方法撰寫在userSchema)
  const isCorrectPassword = await user?.correctPassword(
    password, // 用戶輸入密碼
    user.password //MongoDB 上 bcrypt 加密密碼
  );

  if (user && !isCorrectPassword) {
    user.tryLoginCount += 1;
  }

  const blockTimeKeeper = () =>
    Date.now() - new Date(user.tryLoginTime).getTime();

  //顯示阻擋剩餘時間
  const printWattlingTime = (blockTime) =>
    Math.floor((blockTime - blockTimeKeeper()) / (1000 * 60));

  //blockTime(鎖定時間), tryTimes(嘗試次數)
  const isUserBlock = (blockTime, tryTimes) => {
    //到達指定次數給予時間戳記
    if (user.tryLoginCount === tryTimes) user.tryLoginTime ??= Date.now();
    //找不到使用者或時間戳記跳出
    if (!user || !user.tryLoginTime) return false;
    //如果已到達設定阻擋時間
    if (blockTimeKeeper() >= blockTime) {
      user.tryLoginCount = 0;
      user.tryLoginTime = undefined;
      return false;
    }
    //dev 檢查
    if (blockTimeKeeper() < 0) {
      console.log('出現超過現在時間的戳記在DateBase');
    }
    //使用者登入次輸超過10次
    if (user.tryLoginCount > 10) return true;
  };

  const blockResult = isUserBlock(60 * 60 * 1000, 10);
  console.log(blockResult, user.tryLoginCount);

  await user.save({ validateBeforeSave: false });

  if (blockResult) {
    return next(
      new AppError(
        `此帳戶嘗試多次登入請等待 ${printWattlingTime(60 * 60 * 1000)} 分鐘`,
        401
      )
    );
  }

  if (user && isCorrectPassword) {
    const userBrowserAgent = req.headers['user-agent'];
    user.tryLoginCount = 0;
    await user.save({ validateBeforeSave: false });
    sendJWTTokenToClient(user, 200, res, userBrowserAgent);
    // res.status(200).json({
    //   status: 'success',
    //   token,
    // });
  } else {
    return next(new AppError(`登入失敗！， 請從新確認 email 或 password`), 401);
  }
});

exports.logout = (req, res) => {
  //safari cookie 不會刪除
  // res.clearCookie('jwt', { domain: '127.0.0.1', path: '/' });
  res.cookie('jwt', 'loggedout', {
    expires: new Date(Date.now() + 1 * 1000),
    httpOnly: true,
  });
  res.status(200).json({
    status: 'scuess',
    message: '成功登出',
  });
};

//確認用戶是否已登入(給前端使用)
exports.isLogin = async (req, res, next) => {
  if (req.cookies.jwt) {
    try {
      //1.驗證token 是否串改
      const decodeData = await promisify(jwt.verify)(
        req.cookies.jwt,
        process.env.JWT_SECRET
      );

      //2. user
      const user = await User.findById(decodeData.id);
      if (!user) return next();

      //3.確認用戶是否更改密碼
      if (user.changedPasswordAfter(decodeData.iat)) {
        return next();
      }
      //login userData
      res.locals.user = user;
    } catch (err) {
      return next();
    }
  }
  next();
};

//確認用戶是否登入，同時驗證Token(是否可以訪問路由)
exports.protect = catchAsync(async (req, res, next) => {
  const { authorization } = req.headers;
  let token;
  if (authorization && authorization.startsWith('Bearer')) {
    token = authorization?.split(' ')[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  //1.確認token 是否存在
  if (!token) return next(new AppError('您還未登入！', 401));

  //3.確認UserID 是否存在於MongoDB
  //任何會大量運算程式碼不應蓋採用同步方式來操作，這裡使用nodeJs promisify方法wrapper 成promise風格非同步語法
  // const decodeData = jwt.verify(token, process.env.JWT_SECRET); //錯誤寫法
  const decodeData = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  //相對正確
  const user = await User.findById(decodeData.id);
  if (!user)
    return next(new AppError('憑證(Token)對應用戶失效！，請重新登入', 401));

  //4.確認用戶是否更改密碼
  if (user.changedPasswordAfter(decodeData.iat)) {
    return next(new AppError('用戶已更新密碼！，請重新登入', 401));
  }

  //send middleware req data
  req.user = user;
  //send temp ejs data
  res.locals.user = user;

  next();
});

exports.restrictTo =
  (...role) =>
  (req, res, next) => {
    if (!role.includes(req.user.role)) {
      return next(new AppError('用戶權限不足', 403));
    }
    next();
  };

//user password forget, send email to user include token(Not JWT).
exports.forgetPassword = catchAsync(async (req, res, next) => {
  //1. Get User based on POSTed Email
  const user = await User.findOne({ email: req.body.email });

  if (!user) return next(new AppError('此帳戶不存在', 404));

  //2.Generate the random reset token(NOT JWT)
  const resetToken = user.createPasswordResetToken();

  await user.save({ validateBeforeSave: false });

  //3.Send it to user's email
  const resetURL = `${req.protocol}://${req.get(
    'host'
  )}/resetPassword/${resetToken}`;

  try {
    await new Email(user, resetURL).sendResetPassword();
    res.status(200).json({
      status: 'success',
      message: '已發送Token 至信箱',
    });
  } catch (error) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;

    return next(new AppError('發送郵件發生錯誤，請重新嘗試！'), 500);
  }
});

//user reset password.
exports.resetPassword = catchAsync(async (req, res, next) => {
  //compare token
  const resetToken = req.params.token;
  const hashedToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  if (!user) return next(new AppError('更改密碼信件到期，請重新嘗試'), 400);

  //完成密碼更改
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;

  await user.save();

  res.status(200).json({
    status: 'success',
    message: '密碼更改成功！',
  });
});

//用戶更新密碼
exports.updatePassword = catchAsync(async (req, res, next) => {
  const { currentPassword, password, passwordConfirm } = req.body;
  if (!currentPassword || !password || !passwordConfirm) {
    return next(new AppError('請確認是否有未填欄位'), 401);
  }
  const user = await User.findById(req.user.id).select('+password');
  if (!user) return next(new AppError('用戶已被註銷，請重新登入！'), 403);

  const isCorrectPassword = await user?.correctPassword(
    currentPassword, // 用戶輸入密碼
    user.password //MongoDB 上 bcrypt 加密密碼
  );

  if (!password || !isCorrectPassword)
    return next(new AppError('請確認輸入密碼是否正確', 401));

  if (password !== passwordConfirm)
    return next(new AppError('請確認輸入更改密碼與確認更改密碼是否一致', 401));

  //save newPassword
  user.password = password;
  user.passwordConfirm = passwordConfirm;

  await user.save();

  sendJWTTokenToClient(user, 200, res);
});
