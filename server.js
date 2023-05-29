//3-rd ENV
const dotenv = require('dotenv');
//mongoose
const mongoose = require('mongoose');

//發生同步程式錯誤
process.on('uncaughtException', (err) => {
  console.log('發生不可以預期錯誤uncaughtException被觸發，已嘗試關閉應用程序');
  console.log(err.name, err.message);
  process.exit(1);
});

dotenv.config({ path: './config.env' });

const database = {
  server: process.env.DATABASE.replace(
    '<PASSWORD>',
    process.env.DATABASE_PASSWORD
  ),
  local: process.env.DATABASE_LOCAL,
};

mongoose.connect(database.local, {
  useNewUrlParser: true,
});

const db = mongoose.connection;
db.on('error', () => console.log('mongoDB 連結失敗！'));
db.once('open', () => console.log('mongoDB 連結成功！'));

//Express
const port = process.env?.PORT || 5501;

const app = require('./app');

const server = app.listen(port, () =>
  console.log(
    `NODE_ENV:${process.env?.NODE_ENV}\nApplication Start:http://127.0.0.1:${port}`
  )
);

//發生全域的連線錯誤
process.on('unhandledRejection', (err) => {
  console.log('[contention error]', err.name, err.message);
  console.log('發生不可以預期錯誤unhandledRejection被觸發，已嘗試關閉應用程序');
  server.close(() => {
    process.exit(1);
  });
});
