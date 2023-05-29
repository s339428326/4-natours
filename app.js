const path = require('path');
//express
const express = require('express');
//3-rd plugin
const morgan = require('morgan'); //顯示封包訊息
const rateLimit = require('express-rate-limit'); //限制傳送次數
const helmet = require('helmet'); //setting HTTP Header secure application
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');
const comparession = require('compression');

//until
const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');

//router
const tourRouter = require('./routes/toursRoutes');
const userRouter = require('./routes/usersRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const viewRouter = require('./routes/viewRoutes');
const bookingRouter = require('./routes/bookingRoutes');
const compression = require('compression');

const app = express();

//ejs
app.set('view engine', 'ejs');
app.set('layouts', path.join(__dirname, 'layouts', 'index'));
app.use(express.static(path.join(__dirname, 'public')));

//start application show run model dev or prod
console.log(process.env?.NODE_ENV);

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ['data:', 'blob:', 'https:', 'ws:'],
        baseUri: ["'self'"],
        fontSrc: ["'self'", 'https:', 'data:'],
        scriptSrc: [
          "'self'",
          'https:',
          'http:',
          'blob:',
          'https://*.mapbox.com',
          'https://js.stripe.com',
          'https://m.stripe.network',
          'https://*.cloudflare.com',
        ],
        frameSrc: ["'self'", 'https://js.stripe.com'],
        objectSrc: ["'none'"],
        styleSrc: ["'self'", 'https:', "'unsafe-inline'"],
        workerSrc: [
          "'self'",
          'data:',
          'blob:',
          'https://*.tiles.mapbox.com',
          'https://api.mapbox.com',
          'https://events.mapbox.com',
          'https://m.stripe.network',
        ],
        childSrc: ["'self'", 'blob:'],
        imgSrc: ["'self'", 'data:', 'blob:'],
        formAction: ["'self'"],
        connectSrc: [
          "'self'",
          'data:',
          'blob:',
          'https://*.stripe.com',
          'https://*.mapbox.com',
          'https://*.cloudflare.com/',
          'https://bundle.js:*',
          'ws://127.0.0.1:*/',
          'https://*.tiles.mapbox.com',
          'https://api.mapbox.com',
          'https://events.mapbox.com',
        ],
        // upgradeInsecureRequests: true,
      },
    },
  })
);

if (process.env?.NODE_ENV === 'development') {
  app.use(morgan('dev')); // dev model show request time stamp on terminal
}

//Limiter 100 request pre 15 min.
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分鐘
  max: 100, //限制同一個IP每一個窗口最多100個請求每15分鐘
  message: '目前請求IP短時間內發送太多request請稍後再試！',
});

app.use('/api', limiter);

//body parse
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

//防止使用NoSQL 注入攻擊(PS:或可使用Schema validation 正則即可)
app.use(mongoSanitize());
//防止xss攻擊，如在request 加入HTML tag 作為value
app.use(xss());
//防止參數污染(Ex:在request 路由中加入?sort=price&sort=duration)
app.use(
  hpp({
    //可以使用Ex:?price=400&price=2980的白名單
    whitelist: [
      'duration',
      'ratingsAverage',
      'ratingsQuantity',
      'maxGroupSize',
      'difficulty',
      'price',
    ],
  })
);

//壓縮文檔(HTML, JSON...)
app.use(compression());

//time
app.use((req, res, next) => {
  req.requestTime = Date.now();
  next();
});

app.use('/', viewRouter);
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/review', reviewRouter);
app.use('/api/v1/booking', bookingRouter);

// 新增找不到路由頁面因為，API 提供會影響暫時不設置

//Not found router(所有路由中介)
app.all('*', (req, res, next) => {
  next(new AppError(`找不到 ${req?.originalUrl} 路由`, 404));
});

//Global Error Handling
app.use(globalErrorHandler);

module.exports = app;
