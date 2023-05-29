//utils
const AppError = require('../utils/appError');

/*
Error code:
400：錯誤的請求（例如無效的參數）
401：未授權（例如未登錄）
403：禁止訪問（例如權限不足）
404：未找到資源
500：內部錯誤
*/

const errorHandler = {
  // 找不到旅遊ID
  CastError: function (err) {
    return new AppError(`不合法 ${err.path} ${err.value}`, 400);
  },
  // 新增相同旅遊名稱
  11000: function (err) {
    const fieldsString = Object.keys(err.keyValue).reduce(
      (preValue, currentValue) => `${preValue} `.concat(`${currentValue}`)
    );
    return new AppError(`${fieldsString}已被使用，請重新填寫！`, 400);
  },
  // mongoose Schema Validation Error
  ValidationError: function (err) {
    const { path, type } = err.errors.password.properties;

    if (path === 'password' && type === 'minlength')
      return new AppError(`請確認密碼長度(最小長度為8)`, 400);

    return new AppError(`${err?.message}`, 400);
  },
  JsonWebTokenError: function () {
    return new AppError(`帳號憑證(Token)錯誤，請重新登入！`, 401);
  },
  TokenExpiredError: function () {
    return new AppError(`帳號3個月未登出，請重新登入！`, 401);
  },
};

//設定模式傳送response pattern
//開發模式(process.env.NODE_ENV = development)
const sendErrorDev = (err, req, res) => {
  //使用API response Error
  if (req.originalUrl.startsWith('/api')) {
    res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack,
    });
  }
  //前端view render response Error page
  console.error('ERROR', err);
  res.status(err.statusCode).render('tours', {
    title: 'Error',
    page: 'error',
    msg: err.message,
  });
};

//產品模式(process.env.NODE_ENV = development)
const sendErrorProd = (err, req, res) => {
  //使用API response Error
  if (req.originalUrl.startsWith('/api')) {
    //常規預期錯誤，並客製化的error回傳客戶端的訊息
    if (err.isOperational) {
      return res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
      });
    }

    //如果發生不可預期錯誤會回傳以下狀態(須記錄log)
    console.error(`[ERROR LOG]`, err);
    return res.status(500).json({
      status: 'err',
      message: '發生不可預期的錯誤，目前為開發版本未設有回報功能',
    });
  }

  //前端view render response Error page
  if (err.isOperational) {
    return res.status(err.statusCode).render('tours', {
      title: 'Error',
      page: 'error',
      msg: err.message,
    });
  }
  //如果發生不可預期錯誤會回傳以下
  return res.status(err.statusCode).render('tours', {
    title: 'Error',
    page: 'error',
    msg: '發生錯誤，請在嘗試一次',
  });
};

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, req, res);
    //排除常規error，也標記為可選錯誤(isOPerational)
  } else if (process.env.NODE_ENV === 'production') {
    const caseKeyName = err.code || err.name;
    console.log(err);
    //error handler 存在才執行
    if (errorHandler[caseKeyName]) {
      sendErrorProd(errorHandler[caseKeyName](err), req, res);
    } else {
      sendErrorProd(err, req, res);
    }
  }
};
